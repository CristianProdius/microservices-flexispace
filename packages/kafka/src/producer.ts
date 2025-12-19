import type { Kafka, Producer } from "kafkajs";
import { isKafkaEnabled } from "./client";

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
      console.warn("[Kafka Producer] Failed to connect - messages will be logged only:", error instanceof Error ? error.message : error);
      connected = false;
    }
  };

  const send = async (topic: string, message: object) => {
    if (!connected || !producer) {
      console.log(`[Kafka Producer] Would send to ${topic}:`, JSON.stringify(message));
      return;
    }

    try {
      await producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
    } catch (error) {
      console.error(`[Kafka Producer] Failed to send to ${topic}:`, error instanceof Error ? error.message : error);
    }
  };

  const disconnect = async () => {
    if (producer && connected) {
      await producer.disconnect();
      connected = false;
    }
  };

  return { connect, send, disconnect };
};
