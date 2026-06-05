# Post-deploy follow-ups (2026-06-05 release)

Tracks the 5 operator follow-ups surfaced after merging the 36-branch bug-fix release. Updated by subagents A + B + the controller. Each item carries a status, the evidence/decision, and a link to the runbook that codifies the long-term procedure.

| # | Item | Status | Owner artifact |
|---|---|---|---|
| 1 | Test email-verification flow end-to-end; flip `ENFORCE_EMAIL_VERIFICATION=true` | _Pending — subagent A_ | (status updated below) |
| 2 | Forensic on 06-02 Kafka "no space left" event | _Pending — subagent A_ | (status updated below) |
| 3 | Document JWT secret rotation constraints (must keep `JWT_SECRET ≠ JWT_REFRESH_SECRET`; new `JWT_VERIFICATION_SECRET` / `JWT_PASSWORD_RESET_SECRET`) | _Pending — subagent B_ | [`jwt-rotation.md`](./jwt-rotation.md) |
| 4 | Monitor email-service for duplicate sends caused by `__consumer_offsets` replay | ✅ N/A | see below |
| 5 | Document co-tenant container context on jira-microlab-automation host (tandemdent / delice / audiviz / demetraai untouched) | _Pending — subagent B_ | this doc |

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
