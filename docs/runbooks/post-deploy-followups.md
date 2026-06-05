# Post-deploy follow-ups (2026-06-05 release)

Tracks the 5 operator follow-ups surfaced after merging the 36-branch bug-fix release. Updated by subagents A + B + the controller. Each item carries a status, the evidence/decision, and a link to the runbook that codifies the long-term procedure.

| # | Item | Status | Owner artifact |
|---|---|---|---|
| 1 | Test email-verification flow end-to-end; flip `ENFORCE_EMAIL_VERIFICATION=true` | ✅ done | see Item #1 below |
| 2 | Forensic on 06-02 Kafka "no space left" event | ✅ root-caused | see Item #2 below |
| 3 | Document JWT secret rotation constraints (must keep `JWT_SECRET ≠ JWT_REFRESH_SECRET`; new `JWT_VERIFICATION_SECRET` / `JWT_PASSWORD_RESET_SECRET`) | ✅ done | [`jwt-rotation.md`](./jwt-rotation.md) |
| 4 | Monitor email-service for duplicate sends caused by `__consumer_offsets` replay | ✅ N/A | see Item #4 below |
| 5 | Document co-tenant container context on jira-microlab-automation host (tandemdent / delice / audiviz / demetraai untouched) | ✅ captured | [`rollback.md`](./rollback.md) |

## Item #1 — email verify e2e + flag flip (done)

E2e test passed:

| Step | Result |
|---|---|
| Register a fresh user (POST /auth/register) | HTTP 201, uniform AUTHSVC-002 response |
| `user.email-verification-requested` consumed by email-service | Resend send ok, two messageIds logged (user.created + verification) |
| GET /auth/verify-email?token=… | HTTP 200, `emailVerified: true` |
| Login post-verify | HTTP 200, access+refresh issued |
| Login of an unverified user | HTTP 403 `{"code":"EMAIL_NOT_VERIFIED"}` |

Test users `qa-followup-…` and `qa-unverified-…` were soft-deleted (PII scrubbed, `deletedAt` set).

**Surprise found during the test:** the new vars were in `.env` but were **NOT** mapped through the `x-api-env` anchor in `docker-compose.yml`. `ENFORCE_EMAIL_VERIFICATION`, `JWT_VERIFICATION_SECRET`, `JWT_PASSWORD_RESET_SECRET`, `EMAIL_VERIFICATION_EXPIRES_IN`, `JWT_PASSWORD_RESET_EXPIRES_IN` never reached the container. The code-side fallback (`NODE_ENV === "production"`) was incidentally enforcing email verification, and `JWT_VERIFICATION_SECRET` was silently falling back to `JWT_SECRET` (defeating the AUTHMW-006 distinct-secrets intent).

Fix: commit `f0220a2` adds the five vars to `x-api-env` so every service that includes `<<: *api-env` (auth-service, product-service, order-service) receives them. After the fix, the container's `printenv` confirms all five present with the expected lengths (4 chars / 64 chars / 3 chars). Auth-service force-recreated twice (once to ingest, once to pick up rotated secrets after the values were briefly logged during diagnostics).

## Item #2 — 2026-06-02 Kafka disk-full root cause (done)

Window: 2026-06-02 ~15:29 UTC. ENOSPC came from `containerd` writing layer ingest data to `/var/lib/containerd/io.containerd.content.v1.content/ingest/` during a tandemdent blue/green build. Spacefly's Kafka was an innocent bystander — it failed to write its `replication-offset-checkpoint` because the volume was already at 100%. Evidence in `journalctl` shows a buildkit `Solve` RPC failing with the same ENOSPC at 15:29:09–15:29:11 in the trace `35f12ba82b0d322ce2b42f83b88bd756`, with tandemdent-app-blue rejoining tandemdent-network at 15:06:21 — i.e. mid-deploy.

Host today: 309 GB total, 92 GB used, **218 GB free (30%)**. No daemon log caps configured.

**Recommendations (not auto-applied — each needs an operator decision):**

1. Add `/etc/docker/daemon.json`:
   ```json
   { "log-driver": "json-file", "log-opts": { "max-size": "100m", "max-file": "3" } }
   ```
   Caveat: requires `systemctl restart docker`, which bounces **all** tenants on the host (delice, tandemdent, audiviz, demetraai, ken-v2, lifeos, mitpbot, ProConstruction, ProdiusSkool, auto_wash, tandem-dent, twenty-crm, volvo_service, jiraMicroLabAutomation, plus Spacefly). Coordinate a maintenance window.
2. Schedule a weekly `docker builder prune --keep-storage=2GB --filter "until=168h" --force` cron on the host. This addresses the actual cause of the 06-02 incident (buildkit cache spike) without touching container logs or co-tenant images.
3. Add disk alerting at 80% and 90% so a near-miss is caught before ENOSPC.

The recommendation list lives here; the calls (especially #1) are operator-level.

## Item #4 — consumer-offset replay (resolved N/A)

Verified on 2026-06-05 ~16:55 UTC:

```
$ docker exec spacefly-kafka-1 /opt/kafka/bin/kafka-consumer-groups.sh \
    --bootstrap-server localhost:9092 --describe --group email-service
GROUP          TOPIC                              PART  CURRENT-OFFSET  LOG-END-OFFSET  LAG
email-service  user.created                       0     -               0               -
email-service  user.email-verification-requested  0     -               0               -
email-service  booking.created                    0     -               0               -
email-service  booking.confirmed                  0     -               0               -
email-service  booking.rejected                   0     -               0               -
email-service  booking.cancelled                  0     -               0               -
email-service  booking.completed                  0     -               0               -
(all partitions report LOG-END-OFFSET=0)
```

The Kafka data directory was wiped during the 2026-06-02 disk-full event — `__consumer_offsets` contains nothing to replay because there are no historical records left. Outcome: **no risk of duplicate email sends** from offset replay. Last 10 minutes of email-service activity confirms zero Resend send calls (only `[email-service] DLQ producer connected` startup line). Closing this item; no monitoring needed.

## Rollback (carried over from deploy)

See [`rollback.md`](./rollback.md).

## Acceptance criteria

- **#1** passes when: a fresh registration produces a `user.email-verification-requested` Kafka event, `email-service` logs `Email sent: <id>` for that event, the verify-email endpoint correctly marks `User.emailVerified=true`, and `ENFORCE_EMAIL_VERIFICATION=true` does not break existing logins. If anything fails, leave the flag at `false` and document the gap.
- **#2** passes when: we know what filled the disk on 2026-06-02 ~15:29 UTC (process, path, byte volume) and have an idea whether it's recurring. Bonus: a docker log-rotation cap if logs were the culprit.
- **#3** passes when: `docs/runbooks/jwt-rotation.md` exists and documents the constraint, the rotation steps for each of the 4 secrets, and the recovery path if `JWT_SECRET == JWT_REFRESH_SECRET` after a misconfigured rotation.
- **#4** passes when: 5-minute observation window of `email-service` Resend send activity shows no duplicate `messageId`. If duplicates seen, document the topic + partition + offset range so we can re-set offsets manually.
- **#5** captured in the new runbook with the rule "do not run `docker system prune -a` on this host — it would nuke co-tenant images."

## Item #4 — consumer-offset replay (resolved N/A)

Verified on 2026-06-05 ~16:55 UTC:

```
$ docker exec spacefly-kafka-1 /opt/kafka/bin/kafka-consumer-groups.sh \
    --bootstrap-server localhost:9092 --describe --group email-service
GROUP          TOPIC                              PART  CURRENT-OFFSET  LOG-END-OFFSET  LAG
email-service  user.created                       0     -               0               -
email-service  user.email-verification-requested  0     -               0               -
email-service  booking.created                    0     -               0               -
email-service  booking.confirmed                  0     -               0               -
email-service  booking.rejected                   0     -               0               -
email-service  booking.cancelled                  0     -               0               -
email-service  booking.completed                  0     -               0               -
(all partitions report LOG-END-OFFSET=0)
```

The Kafka data directory was wiped during the 2026-06-02 disk-full event — `__consumer_offsets` contains nothing to replay because there are no historical records left. Outcome: **no risk of duplicate email sends** from offset replay. Last 10 minutes of email-service activity confirms zero Resend send calls (only `[email-service] DLQ producer connected` startup line). Closing this item; no monitoring needed.

## Rollback (carried over from deploy)

See [`rollback.md`](./rollback.md).
