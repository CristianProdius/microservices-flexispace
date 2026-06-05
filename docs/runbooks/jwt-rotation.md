# JWT Secret Rotation — auth-service

Operator runbook for rotating the four JWT signing secrets used by `apps/auth-service`.

All commands assume you are on the prod host as `root` with cwd `/root/spacefly-ai`.

---

## 1. What each secret does

`auth-service` uses four distinct HMAC secrets. They MUST all be different values.

| Env var                       | Signs                       | Default TTL env                       | Default TTL | Notes                                                       |
| ----------------------------- | --------------------------- | ------------------------------------- | ----------- | ----------------------------------------------------------- |
| `JWT_SECRET`                  | Access tokens               | `JWT_EXPIRES_IN`                      | `15m`       | Carries `tokenUse: "access"`.                               |
| `JWT_REFRESH_SECRET`          | Refresh tokens              | `JWT_REFRESH_EXPIRES_IN`              | `30d`       | Carries `tokenUse: "refresh"`. Tracked in `RefreshToken`.   |
| `JWT_VERIFICATION_SECRET`     | Email-verification tokens   | `EMAIL_VERIFICATION_EXPIRES_IN`       | `24h`       | Falls back to `JWT_SECRET` if unset (avoid relying on this).|
| `JWT_PASSWORD_RESET_SECRET`   | Password-reset tokens       | `JWT_PASSWORD_RESET_EXPIRES_IN`       | `30m`       | Short-lived; rotation impact is minimal.                    |

Token claims (all four secrets):

- `iss: "spacefly"`
- `aud: process.env.JWT_AUDIENCE || "spacefly-api"`
- `jti` — unique per token; used for revocation / reuse-detection
- Algorithm is pinned to `HS256` (AUTHMW-001). Verification enforces `iss`, `aud`, and `jti`.

Cross-use protection:

- `verifyAccessToken` rejects any token whose `tokenUse !== "access"`.
- `verifyRefreshToken` rejects any token whose `tokenUse !== "refresh"`.
- AUTHMW-006: at module load, the process refuses to boot if `JWT_SECRET === JWT_REFRESH_SECRET` and both are set. Identical secrets would let a refresh token be replayed as a permanent access token.

Revocation tables:

- `RefreshToken` (jti, userId, usedAt, replacedBy, revoked) — reuse-detection per AUTHSVC-006. Replaying an already-used refresh token revokes the entire rotation chain.
- `RevokedAccessToken` — individual access-token revocation. Written by logout and change-password per AUTHSVC-007.

---

## 2. Generation

Use `openssl` to generate 256-bit (64 hex char) secrets. Each secret MUST be unique.

```sh
openssl rand -hex 32   # JWT_SECRET
openssl rand -hex 32   # JWT_REFRESH_SECRET
openssl rand -hex 32   # JWT_VERIFICATION_SECRET
openssl rand -hex 32   # JWT_PASSWORD_RESET_SECRET
```

Never reuse a value across two of the four variables. The boot-time guard only catches `JWT_SECRET === JWT_REFRESH_SECRET`; the other collisions are silently insecure.

---

## 3. Backup before any rotation

Always snapshot `.env` first.

```sh
cd /root/spacefly-ai
cp .env .env.bak.$(date -u +%Y%m%dT%H%M%SZ)
```

---

## 4. Rotation procedure (non-emergency)

Rotate one secret at a time. After editing `/root/spacefly-ai/.env`, restart `auth-service`:

```sh
docker compose -f docker-compose.yml -f docker-compose.nginx.yml --env-file .env up -d --force-recreate auth-service
docker compose -f docker-compose.yml -f docker-compose.nginx.yml --env-file .env logs -f auth-service
```

### 4.1 Rotate `JWT_SECRET`

Effect:

- All existing access tokens immediately become invalid.
- Clients use their refresh tokens to mint a new access token via `POST /auth/refresh`. Expect brief login churn (one extra refresh round-trip per active client).
- Existing refresh tokens (signed by `JWT_REFRESH_SECRET`) are unaffected.

Steps:

```sh
cp .env .env.bak.$(date -u +%Y%m%dT%H%M%SZ)
NEW=$(openssl rand -hex 32)
sed -i.tmp "s|^JWT_SECRET=.*|JWT_SECRET=${NEW}|" .env && rm .env.tmp
docker compose -f docker-compose.yml -f docker-compose.nginx.yml --env-file .env up -d --force-recreate auth-service
```

### 4.2 Rotate `JWT_REFRESH_SECRET`

Effect:

- All existing refresh tokens immediately become invalid.
- Every client is logged out and must re-login.
- Schedule during a low-traffic window.

Steps:

```sh
cp .env .env.bak.$(date -u +%Y%m%dT%H%M%SZ)
NEW=$(openssl rand -hex 32)
# Make sure the new value is NOT equal to JWT_SECRET.
grep '^JWT_SECRET=' .env
sed -i.tmp "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=${NEW}|" .env && rm .env.tmp
docker compose -f docker-compose.yml -f docker-compose.nginx.yml --env-file .env up -d --force-recreate auth-service
```

The `RefreshToken` rotation-chain rows signed by the previous generation are now orphaned (they will never be matched again). Clean expired rows:

```sh
docker exec -e PGPASSWORD=$POSTGRES_PASSWORD spacefly-postgres-1 \
  psql -U $POSTGRES_USER -d $POSTGRES_DB \
  -c 'DELETE FROM "RefreshToken" WHERE "expiresAt" < NOW();'
```

(Optional: a more aggressive cleanup is `DELETE FROM "RefreshToken" WHERE "revoked" = true OR "usedAt" IS NOT NULL;` but only after you have confirmed no audit/forensics need for the chain.)

### 4.3 Rotate `JWT_VERIFICATION_SECRET`

Effect:

- In-flight verification emails become invalid.
- Affected users must request a new link via `POST /auth/resend-verification`.
- Low impact — verification tokens are 24h max.

Steps:

```sh
cp .env .env.bak.$(date -u +%Y%m%dT%H%M%SZ)
NEW=$(openssl rand -hex 32)
sed -i.tmp "s|^JWT_VERIFICATION_SECRET=.*|JWT_VERIFICATION_SECRET=${NEW}|" .env && rm .env.tmp
docker compose -f docker-compose.yml -f docker-compose.nginx.yml --env-file .env up -d --force-recreate auth-service
```

If `JWT_VERIFICATION_SECRET` is currently unset and falling back to `JWT_SECRET`, set it explicitly to a fresh value — don't rely on the fallback.

### 4.4 Rotate `JWT_PASSWORD_RESET_SECRET`

Effect:

- In-flight password-reset links become invalid.
- Affected users must restart via `POST /auth/forgot-password`.
- Low impact — reset tokens are 30m max.

Steps:

```sh
cp .env .env.bak.$(date -u +%Y%m%dT%H%M%SZ)
NEW=$(openssl rand -hex 32)
sed -i.tmp "s|^JWT_PASSWORD_RESET_SECRET=.*|JWT_PASSWORD_RESET_SECRET=${NEW}|" .env && rm .env.tmp
docker compose -f docker-compose.yml -f docker-compose.nginx.yml --env-file .env up -d --force-recreate auth-service
```

---

## 5. Emergency rotation (suspected compromise)

If you believe any secret has leaked, rotate all four and force a full logout. Accept the side effects (every user re-logs in; in-flight password resets and verification emails restart).

```sh
cd /root/spacefly-ai
cp .env .env.bak.$(date -u +%Y%m%dT%H%M%SZ)

# 1. Generate four fresh, distinct secrets.
S1=$(openssl rand -hex 32)
S2=$(openssl rand -hex 32)
S3=$(openssl rand -hex 32)
S4=$(openssl rand -hex 32)

# 2. Write them into .env.
sed -i.tmp \
  -e "s|^JWT_SECRET=.*|JWT_SECRET=${S1}|" \
  -e "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=${S2}|" \
  -e "s|^JWT_VERIFICATION_SECRET=.*|JWT_VERIFICATION_SECRET=${S3}|" \
  -e "s|^JWT_PASSWORD_RESET_SECRET=.*|JWT_PASSWORD_RESET_SECRET=${S4}|" \
  .env && rm .env.tmp

# 3. Force-restart auth-service.
docker compose -f docker-compose.yml -f docker-compose.nginx.yml --env-file .env up -d --force-recreate auth-service

# 4. Nuke session + token state. Every user re-logs in.
docker exec -e PGPASSWORD=$POSTGRES_PASSWORD spacefly-postgres-1 \
  psql -U $POSTGRES_USER -d $POSTGRES_DB <<'SQL'
DELETE FROM "Session";
DELETE FROM "RefreshToken";
TRUNCATE "RevokedAccessToken";
SQL
```

After the SQL completes, monitor `auth-service` logs and admin UI login for 10 minutes. Notify users via the operational channel that re-login is required.

---

## 6. Misconfiguration recovery

If `auth-service` refuses to boot with:

```
JWT_SECRET and JWT_REFRESH_SECRET must be different
```

That is AUTHMW-006 catching the identical-secrets footgun. The fix:

```sh
cd /root/spacefly-ai
cp .env .env.bak.$(date -u +%Y%m%dT%H%M%SZ)
NEW=$(openssl rand -hex 32)
sed -i.tmp "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=${NEW}|" .env && rm .env.tmp
docker compose -f docker-compose.yml -f docker-compose.nginx.yml --env-file .env up -d --force-recreate auth-service
```

Side effect: rotating `JWT_REFRESH_SECRET` logs every user out. There is no path back — accept it and move on.

---

## 7. Where the secrets live

- Production: `/root/spacefly-ai/.env` on the prod host (`jira-microlab-automation`, `138.197.178.212`).
- Backups: `/root/spacefly-ai/.env.bak.<UTC-timestamp>` (created by step 3 above).
- CI: `.github/workflows/ci.yml` contains hardcoded placeholder JWT values for typecheck/build only. Those are NOT the real production secrets and MUST NEVER be copied from prod. CI does not need rotation.

Do not commit `.env` to git. Do not paste secrets into chat, PRs, or ClickUp.
