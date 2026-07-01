-- AUDIT-B8: per-user access-token kill-switch epoch. Auth middleware rejects any
-- access token issued at or before this instant (password change, forced
-- logout-everywhere, role revocation). Null = no cutoff, all tokens valid.
ALTER TABLE "User" ADD COLUMN "tokensValidAfter" TIMESTAMP(3);
