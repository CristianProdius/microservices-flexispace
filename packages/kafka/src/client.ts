import { Kafka } from "kafkajs";

const KAFKA_ENABLED = process.env.KAFKA_ENABLED !== "false";
const KAFKA_BROKERS = process.env.KAFKA_BROKERS?.split(",") || [
  "localhost:9094",
  "localhost:9095",
  "localhost:9096",
];

export const createKafkaClient = (service: string) => {
  if (!KAFKA_ENABLED) {
    console.log(`[${service}] Kafka disabled - running without message queue`);
  }

  return new Kafka({
    clientId: service,
    brokers: KAFKA_BROKERS,
    retry: {
      initialRetryTime: 1000,
      retries: 3,
    },
  });
};

export const isKafkaEnabled = () => KAFKA_ENABLED;
