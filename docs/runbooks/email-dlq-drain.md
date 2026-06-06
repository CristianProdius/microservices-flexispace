# Runbook: Draining the `email.dlq` topic

**Owner:** Platform / Email service
**Tracks:** AUD-015 (DLQ produced but no consumer)
**Status:** Inspect-and-document tooling shipped. A replay job is **future work** — see the "Replay" section.

## Background

`apps/email-service` parks two kinds of messages onto the Kafka topic `email.dlq`:

- **`parse_error`** — the message value was not valid JSON. These are poison messages and will never succeed on retry.
- **`max_retries_exceeded`** — handler threw 5 times in a row (transient failure budget exhausted). Most commonly a Resend outage or a missing env var.

Each DLQ record carries headers describing the original delivery:

| Header | Meaning |
| --- | --- |
| `x-source-topic` | The topic the message was originally consumed from (e.g. `user.created`) |
| `x-source-partition` | Original partition number |
| `x-source-offset` | Original offset on the source topic |
| `x-retry-count` | Attempts made before parking (0 for `parse_error`) |
| `x-dlq-reason` | `parse_error` or `max_retries_exceeded` |
| `x-error` | Stringified error message |
| `x-failed-at` | ISO timestamp when the DLQ publish happened |

The original `value` (Buffer) is preserved verbatim so replay tooling can re-emit it onto the source topic.

## Inspecting the DLQ

The Kafka broker container `spacefly-kafka-1` ships the `kafka-console-consumer.sh` and `kafka-configs.sh` scripts. Use them directly via `docker exec`.

### Peek at the most recent N messages (without committing offsets)

```bash
docker exec spacefly-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic email.dlq \
  --from-beginning \
  --max-messages 10 \
  --property print.headers=true \
  --property print.timestamp=true
```

Tip: omit `--from-beginning` and add `--offset latest` to tail live failures while
debugging an active incident.

### Count messages currently in the DLQ

```bash
docker exec spacefly-kafka-1 /opt/kafka/bin/kafka-run-class.sh \
  kafka.tools.GetOffsetShell \
  --broker-list localhost:9092 \
  --topic email.dlq
```

Subtract the earliest offset from the latest offset per partition to get the
backlog. (No consumer-group state exists yet because no replay consumer is
running.)

### Filter by source topic

`kafka-console-consumer.sh` cannot filter by header server-side. Pipe the
output through `grep` on the `x-source-topic` line, or use `kcat` if it's
installed on the host:

```bash
docker exec spacefly-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic email.dlq \
  --from-beginning \
  --property print.headers=true \
  | grep -A1 'x-source-topic:user.created'
```

## Retention policy

The DLQ has no consumer, so without explicit retention it will grow forever and
eventually fill the broker disk. Recommended floor: **7 days** for dev, **30
days** for prod (long enough to investigate + replay across a weekend, short
enough to bound disk).

Set retention in milliseconds via `kafka-configs.sh`:

```bash
# 7 days = 604800000 ms
docker exec spacefly-kafka-1 /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server localhost:9092 \
  --entity-type topics \
  --entity-name email.dlq \
  --alter \
  --add-config retention.ms=604800000

# 30 days = 2592000000 ms
docker exec spacefly-kafka-1 /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server localhost:9092 \
  --entity-type topics \
  --entity-name email.dlq \
  --alter \
  --add-config retention.ms=2592000000
```

Verify current config:

```bash
docker exec spacefly-kafka-1 /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server localhost:9092 \
  --entity-type topics \
  --entity-name email.dlq \
  --describe
```

## When to escalate

- **Any message with `x-dlq-reason=parse_error`** → producer-side bug. The
  source topic is shipping malformed JSON. Page the team that owns
  `x-source-topic` (most likely `auth-service` for `user.*` topics or
  `product-service` for `booking.*`).
- **Sustained `max_retries_exceeded` across multiple topics** → almost
  certainly a Resend outage or a config issue (`RESEND_API_KEY`,
  `RESEND_FROM_EMAIL`, `EMAIL_VERIFICATION_LINK_BASE`,
  `PASSWORD_RESET_LINK_BASE`). Check `/health` on `email-service` and the
  Resend status page before replaying.
- **Backlog > 1,000 messages** → page on-call. The DLQ is meant to be small;
  a large backlog implies an unhandled outage or a producer schema break.

## Replay (FUTURE WORK)

There is **no automated replay tool yet** — this runbook is inspect-only. When
a replay job is built it should:

1. Consume `email.dlq` with a dedicated consumer group (e.g. `email-dlq-replay`).
2. Read `x-source-topic` from headers and re-produce the original `value` onto
   that topic.
3. Track replayed offsets so a stuck poison message doesn't get re-replayed
   forever.
4. Honor the idempotency keys already shipped in `sendMail` (AUD-013) so a
   replay during the 24h Resend dedup window is safe even if the original
   send eventually succeeded.

Until that exists, manual replay is possible by `docker exec`-ing into the
broker and using `kafka-console-producer.sh` to re-emit the JSON value onto
the source topic. Do this only after confirming the underlying cause is fixed.
