-- DB-003: Drop redundant secondary indexes that duplicate the unique B-tree
-- indexes created automatically by Postgres for @unique columns.
--   * User.email and User.username already have *_key unique indexes.
--   * Session.token already has Session_token_key.
-- Keeping the duplicate indexes wastes disk and slows writes for no benefit.

DROP INDEX IF EXISTS "public"."User_email_idx";
DROP INDEX IF EXISTS "public"."User_username_idx";
DROP INDEX IF EXISTS "public"."Session_token_idx";
