import type { Kafka, Producer } from "kafkajs";
import { isKafkaEnabled } from "./client";

/**
 * Thrown when the producer cannot establish its initial broker connection.
 * Callers (typically service `index.ts` boot code) should let this propagate
 * so the process exits non-zero and the orchestrator restarts it. Running
 * with a "log-only" producer silently loses events (KAFKA-002).
 */
export class KafkaProducerConnectError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "KafkaProducerConnectError";
  }
}

/**
 * Thrown when a `send` fails — either because the producer was never
 * connected or because KafkaJS surfaced an error after its internal
 * retries were exhausted. Callers must decide explicitly whether to fail
 * the request (critical event) or log-and-continue (best-effort event).
 *
 * Follow-up: a transactional outbox would make the DB write + event
 * publish atomic; until then individual callers carry the consistency
 * gap. Tracked separately from KAFKA-001/002.
 */
export class KafkaProducerSendError extends Error {
  constructor(message: string, public readonly topic: string, public readonly cause?: unknown) {
    super(message);
    this.name = "KafkaProducerSendError";
  }
}

export const createProducer = (kafka: Kafka) => {
  let producer: Producer | null = null;
  let connected = false;

  const connect = async () => {
    if (!isKafkaEnabled()) {
      console.log("[Kafka Producer] Disabled - skipping connection");
      return;
    }

    try {
      producer = kafka.producer();
      await producer.connect();
      connected = true;
      console.log("[Kafka Producer] Connected");
    } catch (error) {
      connected = false;
      producer = null;
      const message = error instanceof Error ? error.message : String(error);
      console.error("[Kafka Producer] Failed to connect:", message);
      throw new KafkaProducerConnectError(
        `Kafka producer failed to connect: ${message}`,
        error
      );
    }
  };

  const send = async (topic: string, message: object) => {
    if (!isKafkaEnabled()) {
      console.log(`[Kafka Producer] Disabled - would send to ${topic}:`, JSON.stringify(message));
      return;
    }

    if (!connected || !producer) {
      throw new KafkaProducerSendError(
        `Kafka producer is not connected; cannot send to ${topic}`,
        topic
      );
    }

    try {
      await producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      throw new KafkaProducerSendError(
        `Kafka producer failed to send to ${topic}: ${errMsg}`,
        topic,
        error
      );
    }
  };

  const disconnect = async () => {
    if (producer && connected) {
      await producer.disconnect();
      connected = false;
    }
  };

  /**
   * True when the producer has an established broker connection. Intended for
   * `/health` probes — if this returns false in production, the orchestrator
   * should consider the pod unhealthy.
   *
   * Note: Returns true when Kafka is disabled via `KAFKA_ENABLED=false`, so a
   * locally-running service without Kafka still reports healthy.
   */
  const isHealthy = (): boolean => {
    if (!isKafkaEnabled()) return true;
    return connected && producer !== null;
  };

  return { connect, send, disconnect, isHealthy };
};
