import { createConsumer, createKafkaClient, createProducer } from "@repo/kafka";

const kafkaClient = createKafkaClient("space-service");

export const producer = createProducer(kafkaClient);
export const consumer = createConsumer(kafkaClient, "space-group");
