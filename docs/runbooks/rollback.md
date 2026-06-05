# SpaceFly.ai Rollback Runbook

Procedure developed during the 2026-06-05 "131 bugs" deploy.

- Pre-deploy commit: `b39756c`
- Post-deploy commit (after 2 hot-fixes): `59b61ae`
- DB snapshot: `/root/spacefly-ai/backups/predeploy-20260605T163311Z.sql.gz`
- Env snapshot: `/root/spacefly-ai/.env.bak.20260605T163241Z`

This deploy applied 13 Prisma migrations, including the destructive `20260605100200_drop_space_location_columns`, which dropped `Space.address`, `Space.city`, `Space.state`, `Space.country`, `Space.postalCode`, `Space.latitude`, and `Space.longitude`. Location now lives on `Venue`.

All commands assume you are on the prod host as `root` with cwd `/root/spacefly-ai`.

---

## 1. When to roll back

Trigger a rollback if, after the deploy:

- `auth-service` refuses logins or returns 5xx on `/auth/login` or `/auth/refresh`.
- Bookings or payouts stop firing webhook events / database writes.
- Admin UI (`https://admin.spacefly.ai`) returns 5xx on core flows.
- Product / order / email service health endpoints fail repeatedly.
- A critical data-integrity regression is observed (e.g. wrong owner on bookings, payouts going to wrong account).
- A confirmed P0 security regression (auth bypass, IDOR, leaked secret).

If the issue can be fixed forward in under 30 minutes, prefer the fix-forward. Roll back only when forward fix is uncertain or slower than rollback + data-loss recovery.

---

## 2. Host context — co-tenant warning

The prod host (`jira-microlab-automation`, `138.197.178.212`) co-runs many unrelated projects on the same Docker daemon:

`tandemdent`, `delice`, `audiviz`, `demetraai`, `mitpbot`, `lifeos`, `ken-v2`, `ProConstruction`, `ProdiusSkool`, `auto_wash`, `tandem-dent`, `twenty-crm`, `volvo_service`, `jiraMicroLabAutomation`.

**NEVER** run any of the following during a SpaceFly rollback — they will damage other tenants:

- `docker system prune -a` — nukes all unused images, including co-tenant ones.
- `docker volume prune` — nukes co-tenant volumes.
- `systemctl restart docker` — interrupts every tenant on the host.
- `git clean -fdx` anywhere outside `/root/spacefly-ai`.

Scope every command to `/root/spacefly-ai`, to the SpaceFly compose project, and to the `spacefly-postgres-1` container.

---

## 3. Code-only rollback

Use this ONLY if the migrations are forward-compatible from the user's perspective (no destructive schema changes that the old code depends on). For the 2026-06-05 deploy, see the warning below — code-only rollback is NOT safe for that release.

```sh
ssh jira-microlab-automation
cd /root/spacefly-ai
git reset --hard b39756c
docker compose -f docker-compose.yml -f docker-compose.nginx.yml --env-file .env build
docker compose -f docker-compose.yml -f docker-compose.nginx.yml --env-file .env up -d --force-recreate
```

**WARNING — not safe for the 2026-06-05 deploy.** The pre-deploy code at `b39756c` reads `Space.address`, `Space.city`, `Space.state`, `Space.country`, `Space.postalCode`, `Space.latitude`, `Space.longitude` directly from the `Space` table. The `20260605100200_drop_space_location_columns` migration has dropped those columns. Code-only rollback will boot, then immediately throw Prisma errors on every Space read.

For this release, you MUST use the full rollback in section 4.

---

## 4. Full rollback (code + schema)

Required when the deploy included destructive migrations (this is the case for the 2026-06-05 deploy).

**WARNING — DATA LOSS.** Any user activity (registrations, logins creating new sessions, bookings, payouts, verification clicks, password resets, profile edits, image uploads referenced in DB rows) between the predeploy snapshot at `20260605T163311Z` and the rollback-savepoint you take below will be LOST. The window between `predeploy-20260605T163311Z.sql.gz` and `rollback-savepoint-<NOW>.sql.gz` is the data-loss window. Announce maintenance / data-loss to stakeholders before proceeding.

```sh
ssh jira-microlab-automation
cd /root/spacefly-ai

# 4.1 Stop SpaceFly services (leave Postgres running for backup + restore).
docker compose -f docker-compose.yml -f docker-compose.nginx.yml --env-file .env stop \
  client admin auth-service product-service order-service email-service

# 4.2 Snapshot the post-deploy DB state BEFORE destroying it.
# This is your only path to recover the data-loss window if rollback itself fails.
docker exec -e PGPASSWORD=$POSTGRES_PASSWORD spacefly-postgres-1 \
  pg_dump -U $POSTGRES_USER -d $POSTGRES_DB \
  | gzip > backups/rollback-savepoint-$(date -u +%Y%m%dT%H%M%SZ).sql.gz

# 4.3 Drop and recreate the database.
docker exec -e PGPASSWORD=$POSTGRES_PASSWORD spacefly-postgres-1 \
  psql -U $POSTGRES_USER \
  -c 'DROP DATABASE IF EXISTS spacefly WITH (FORCE); CREATE DATABASE spacefly;'

# 4.4 Restore the predeploy snapshot.
zcat backups/predeploy-20260605T163311Z.sql.gz \
  | docker exec -i -e PGPASSWORD=$POSTGRES_PASSWORD spacefly-postgres-1 \
      psql -U $POSTGRES_USER -d $POSTGRES_DB

# 4.5 Restore the env file.
cp .env.bak.20260605T163241Z .env

# 4.6 Reset code to the predeploy commit.
git reset --hard b39756c

# 4.7 Rebuild and bring the stack back up.
scripts/deploy.sh build
scripts/deploy.sh up

# 4.8 Health check.
scripts/deploy.sh health
```

Then run the validation steps in section 6.

---

## 5. Partial rollback (one service only)

If only a single service is misbehaving and you are confident its public contract has not changed (no new env vars, no new DB-column reads, no new shared-package signatures):

```sh
cd /root/spacefly-ai
git checkout b39756c -- apps/<service>/
docker compose -f docker-compose.yml -f docker-compose.nginx.yml --env-file .env build <service>
docker compose -f docker-compose.yml -f docker-compose.nginx.yml --env-file .env up -d --no-deps --force-recreate <service>
```

**Caveat.** This only works when the rolled-back service's contract with `@repo/db` and `@repo/auth-middleware` is still compatible with the old code. After the 2026-06-05 deploy that contract has shifted (Prisma schema changes, AUTHMW-001/006 token-claim changes). In practice partial rollback rarely works cleanly for this release — prefer section 4.

If you do attempt a partial rollback, monitor that service's logs and `scripts/deploy.sh health` for the first 15 minutes.

---

## 6. Validation after rollback

After section 4 (or section 5) completes:

```sh
# Aggregate health from the deploy script.
scripts/deploy.sh health

# Per-service health endpoints (each should return HTTP 200).
curl -sf https://api.spacefly.ai/health/auth
curl -sf https://api.spacefly.ai/health/product
curl -sf https://api.spacefly.ai/health/order
```

Then, manually:

- Log in to `https://admin.spacefly.ai` with an admin account.
- Open the spaces list and confirm at least one space renders without 5xx.
- Open a booking and confirm it renders.
- Tail `auth-service` logs for 5 minutes and confirm no boot-time errors:
  ```sh
  docker compose -f docker-compose.yml -f docker-compose.nginx.yml --env-file .env logs -f --tail=200 auth-service
  ```

If validation fails, do NOT roll forward again blindly — open an incident, attach the `rollback-savepoint-*.sql.gz` filename, and triage from there.
