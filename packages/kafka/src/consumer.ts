import type { Kafka, Consumer } from "kafkajs";
import { isKafkaEnabled } from "./client";

export const createConsumer = (kafka: Kafka, groupId: string) => {
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
      console.warn(`[Kafka Consumer ${groupId}] Failed to connect:`, error instanceof Error ? error.message : error);
      connected = false;
    }
  };

  const subscribe = async (
    topics: {
      topicName: string;
      topicHandler: (message: any) => Promise<void>;
    }[]
  ) => {
    if (!connected || !consumer) {
      console.log(`[Kafka Consumer ${groupId}] Not connected - skipping subscription to:`, topics.map(t => t.topicName).join(", "));
      return;
    }

    try {
      await consumer.subscribe({
        topics: topics.map((topic) => topic.topicName),
        fromBeginning: true,
      });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const topicConfig = topics.find((t) => t.topicName === topic);
            if (topicConfig) {
              const value = message.value?.toString();

              if (value) {
                await topicConfig.topicHandler(JSON.parse(value));
              }
            }
          } catch (error) {
            console.log("Error processing message", error);
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
