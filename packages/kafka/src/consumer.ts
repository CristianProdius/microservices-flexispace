import type { Kafka, Consumer, Producer } from "kafkajs";
import { isKafkaEnabled } from "./client";

/**
 * Thrown when the consumer cannot establish its initial broker connection.
 * Callers (typically service `index.ts` boot code) should let this propagate
 * so the process exits non-zero and the orchestrator restarts it. Silently
 * running with a disconnected consumer would mean events are never processed
 * even though `/health` may still report green (AUD-032). Symmetrical with
 * `KafkaProducerConnectError` in `./producer`.
 */
export class KafkaConsumerConnectError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "KafkaConsumerConnectError";
  }
}

type DeadLetterQueueConfig = {
  // If provided, payloads that throw inside `topicHandler` are retried
  // in-place (by re-throwing so KafkaJS redelivers the same offset) and only
  // forwarded to `<topic><suffix>` via this producer once `maxAttempts` is
  // exhausted. See AUD-B7 below for why the DLQ hop is terminal rather than
  // fire-on-first-failure.
  producer: Producer;
  topicSuffix?: string;
  // Number of handler attempts (inclusive of the first) before a message is
  // parked in the DLQ. Defaults to `DEFAULT_MAX_ATTEMPTS`.
  maxAttempts?: number;
};

// AUD-B7: default attempt budget before a message is DLQ'd, mirroring the
// email-service consumer's `MAX_RETRIES`. Kept independent of KafkaJS's own
// `retries` config (which governs broker-level redelivery/backoff) — this
// counter is what makes the DLQ *terminal* instead of a phantom side effect
// emitted on every transient failure.
const DEFAULT_MAX_ATTEMPTS = 5;

// Attempt-counter key. Immutable message headers mean we can't stamp an
// attempt count onto the record itself, so we track it in-process keyed by
// `topic:partition:offset`, matching the email-service pattern.
const attemptKey = (topic: string, partition: number, offset: string) =>
  `${topic}:${partition}:${offset}`;

export const createConsumer = (
  kafka: Kafka,
  groupId: string,
  options: { deadLetterQueue?: DeadLetterQueueConfig } = {}
) => {
  let consumer: Consumer | null = null;
  let connected = false;

  // AUD-B7: bounded in-memory attempt counter, scoped per consumer instance.
  // KafkaJS redelivers a throwing offset in-process, so this map accumulates
  // across those redeliveries and is cleared on success or on terminal DLQ.
  // On rebalance the new owner restarts from zero (a fresh retry budget for
  // whoever now owns the partition), which is the intended semantic.
  const attemptCounts = new Map<string, number>();

  const connect = async () => {
    if (!isKafkaEnabled()) {
      console.log(`[Kafka Consumer ${groupId}] Disabled - skipping connection`);
      return;
    }

    try {
      consumer = kafka.consumer({ groupId });
      await consumer.connect();
      connected = true;
      console.log(`[Kafka Consumer ${groupId}] Connected`);
    } catch (error) {
      connected = false;
      consumer = null;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Kafka Consumer ${groupId}] Failed to connect:`, message);
      throw new KafkaConsumerConnectError(
        `Kafka consumer ${groupId} failed to connect: ${message}`,
        error
      );
    }
  };

  const subscribe = async (
    topics: {
      topicName: string;
      topicHandler: (message: any) => Promise<void>;
    }[]
  ) => {
    if (!connected || !consumer) {
      // Safety net for when Kafka is disabled via `KAFKA_ENABLED=false` and
      // `connect()` was a no-op. If we hit this branch while Kafka *is*
      // enabled, that means the caller swallowed a connect error — log loud
      // so it doesn't get silently ignored in production (AUD-032).
      if (isKafkaEnabled()) {
        console.warn(
          `[Kafka Consumer ${groupId}] subscribe() called while disconnected (Kafka enabled). Skipping subscription to:`,
          topics.map((t) => t.topicName).join(", ")
        );
      } else {
        console.log(
          `[Kafka Consumer ${groupId}] Not connected - skipping subscription to:`,
          topics.map((t) => t.topicName).join(", ")
        );
      }
      return;
    }

    try {
      await consumer.subscribe({
        topics: topics.map((topic) => topic.topicName),
        fromBeginning: true,
      });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const topicConfig = topics.find((t) => t.topicName === topic);
          if (!topicConfig) {
            return;
          }

          const value = message.value?.toString();
          if (!value) {
            return;
          }

          let parsed: unknown;
          try {
            parsed = JSON.parse(value);
          } catch (error) {
            console.error(
              `[Kafka Consumer ${groupId}] Dropping malformed JSON on ${topic}@${partition}:${message.offset}:`,
              error instanceof Error ? error.message : error
            );
            return;
          }

          const dlq = options.deadLetterQueue;
          const trackingKey = attemptKey(topic, partition, message.offset);

          try {
            await topicConfig.topicHandler(parsed);
            // AUD-B7: success — drop any accumulated attempt count so an offset
            // reused later (e.g. after compaction/rebalance) starts fresh.
            if (dlq) attemptCounts.delete(trackingKey);
          } catch (error) {
            console.error(
              `[Kafka Consumer ${groupId}] Handler for ${topic}@${partition}:${message.offset} failed:`,
              error instanceof Error ? error.message : error
            );

            // No DLQ configured: preserve prior behaviour — re-throw so KafkaJS
            // applies its retry/backoff policy and the offset stays uncommitted.
            if (!dlq) {
              throw error;
            }

            // AUD-B7: the DLQ is TERMINAL. Count attempts for this
            // topic:partition:offset and keep re-throwing (so KafkaJS redelivers
            // the same offset) until the budget is exhausted. Only on the final
            // attempt do we forward to the DLQ and then resolve normally so
            // KafkaJS commits past this offset. A message is therefore either
            // retried-then-succeeded OR retried-then-DLQ'd, never both — no
            // phantom DLQ copy for a transient failure a later retry would fix,
            // and no replay of already-applied side effects for non-idempotent
            // handlers.
            const maxAttempts = dlq.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
            const attempts = (attemptCounts.get(trackingKey) ?? 0) + 1;
            attemptCounts.set(trackingKey, attempts);

            if (attempts < maxAttempts) {
              console.warn(
                `[Kafka Consumer ${groupId}] Handler for ${topic}@${partition}:${message.offset} failed (attempt ${attempts}/${maxAttempts}); re-throwing for retry.`
              );
              throw error;
            }

            const dlqTopic = `${topic}${dlq.topicSuffix ?? ".dlq"}`;
            try {
              await dlq.producer.send({
                topic: dlqTopic,
                messages: [
                  {
                    key: message.key ?? undefined,
                    value,
                    headers: {
                      "x-original-topic": topic,
                      "x-original-partition": String(partition),
                      "x-original-offset": message.offset,
                      "x-attempts": String(attempts),
                      "x-error": error instanceof Error ? error.message : String(error),
                    },
                  },
                ],
              });
              // Parked in the DLQ after exhausting retries. Clear the counter and
              // return (do NOT re-throw) so KafkaJS commits the offset.
              attemptCounts.delete(trackingKey);
              return;
            } catch (dlqError) {
              // Could not park the message. Do NOT commit — re-throw so KafkaJS
              // redelivers and we retry the DLQ send next time (the counter is
              // already at/over max, so we go straight back to this branch).
              console.error(
                `[Kafka Consumer ${groupId}] Failed to publish to DLQ ${dlqTopic}:`,
                dlqError instanceof Error ? dlqError.message : dlqError
              );
              throw error;
            }
          }
        },
      });

      console.log(`[Kafka Consumer ${groupId}] Subscribed to:`, topics.map(t => t.topicName).join(", "));
    } catch (error) {
      console.error(`[Kafka Consumer ${groupId}] Failed to subscribe:`, error instanceof Error ? error.message : error);
    }
  };

  const disconnect = async () => {
    if (consumer && connected) {
      await consumer.disconnect();
      connected = false;
    }
  };

  return { connect, subscribe, disconnect };
};
