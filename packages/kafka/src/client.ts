import { Kafka, type KafkaConfig, type SASLOptions } from "kafkajs";

/**
 * Kafka client configuration is read lazily (inside the helpers below) so that
 * tests and runtime code can mutate `process.env` after module load and have
 * the changes picked up. Reading the env at module-evaluation time would
 * snapshot the values before e.g. dotenv runs in some contexts.
 *
 * Supported environment variables:
 *   - KAFKA_ENABLED:   "false" or "" disables the client. Anything else (incl.
 *                       unset) is treated as enabled, matching prior behaviour.
 *   - KAFKA_BROKERS:   Comma separated `host:port` list. Defaults to the
 *                       `kafka:9092` broker defined in the repo's
 *                       `docker-compose.yml` (exposed as `localhost:9092`
 *                       for host-side processes).
 *   - KAFKA_SSL:       Any truthy value ("1", "true", "yes", "on") enables
 *                       TLS. Defaults to off.
 *   - KAFKA_SASL_USERNAME / KAFKA_SASL_PASSWORD: When BOTH are set the client
 *                       authenticates with SASL/PLAIN. Otherwise SASL is not
 *                       configured.
 */

const TRUTHY = new Set(["1", "true", "yes", "on"]);

export const isKafkaEnabled = (): boolean => {
  const value = process.env.KAFKA_ENABLED;
  // Unset -> enabled (preserve previous default). Explicit "false" or empty
  // string -> disabled.
  if (value === undefined) return true;
  if (value === "" || value === "false") return false;
  return true;
};

export const getKafkaBrokers = (): string[] => {
  const raw = process.env.KAFKA_BROKERS;
  if (raw && raw.trim().length > 0) {
    return raw
      .split(",")
      .map((b) => b.trim())
      .filter((b) => b.length > 0);
  }
  return ["localhost:9092"];
};

const isTruthy = (value: string | undefined): boolean =>
  value !== undefined && TRUTHY.has(value.toLowerCase());

const getSaslOptions = (): SASLOptions | undefined => {
  const username = process.env.KAFKA_SASL_USERNAME;
  const password = process.env.KAFKA_SASL_PASSWORD;
  if (!username || !password) return undefined;
  return {
    mechanism: "plain",
    username,
    password,
  };
};

export const createKafkaClient = (service: string) => {
  if (!isKafkaEnabled()) {
    console.log(`[${service}] Kafka disabled - running without message queue`);
  }

  const config: KafkaConfig = {
    clientId: service,
    brokers: getKafkaBrokers(),
    retry: {
      initialRetryTime: 1000,
      retries: 3,
    },
  };

  if (isTruthy(process.env.KAFKA_SSL)) {
    config.ssl = true;
  }

  const sasl = getSaslOptions();
  if (sasl) {
    config.sasl = sasl;
    // kafkajs requires ssl to be enabled when SASL/PLAIN is used over the
    // wire in any non-test setup. We don't force it here (to keep
    // backwards-compatible behaviour for local dev brokers that accept
    // PLAIN over plaintext), but operators should set KAFKA_SSL=true in
    // production.
  }

  return new Kafka(config);
};
