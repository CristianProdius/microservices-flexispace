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
  // If provided, payloads that throw inside `topicHandler` are forwarded to
  // `<topic><suffix>` via this producer before the original error is
  // re-thrown so KafkaJS can apply its retry/backoff policy.
  producer: Producer;
  topicSuffix?: string;
};

export const createConsumer = (
  kafka: Kafka,
  groupId: string,
  options: { deadLetterQueue?: DeadLetterQueueConfig } = {}
) => {
  let consumer: Consumer | null = null;
  let connected = false;

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

          try {
            await topicConfig.topicHandler(parsed);
          } catch (error) {
            console.error(
              `[Kafka Consumer ${groupId}] Handler for ${topic}@${partition}:${message.offset} failed:`,
              error instanceof Error ? error.message : error
            );

            const dlq = options.deadLetterQueue;
            if (dlq) {
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
                        "x-error": error instanceof Error ? error.message : String(error),
                      },
                    },
                  ],
                });
              } catch (dlqError) {
                console.error(
                  `[Kafka Consumer ${groupId}] Failed to publish to DLQ ${dlqTopic}:`,
                  dlqError instanceof Error ? dlqError.message : dlqError
                );
              }
            }

            // Re-throw so KafkaJS can apply its retry/backoff policy and so
            // the offset is not committed for a message we failed to handle.
            throw error;
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
