/**
 * AUD-021: small TTL cache for active-user lookups. Both `resolveActingHost`
 * (Express + Fastify) and the `shouldBe*` middleware (AUD-005) consult
 * `prisma.user.findFirst({ id, deletedAt: null })` on every request — that's
 * a guaranteed DB round-trip per request without caching, so we add a tiny
 * size-bounded Map with per-entry TTL. The cache returns `null` for
 * non-existent or soft-deleted users so the caller can treat both as
 * "account no longer active" without an extra branch.
 *
 * Kept deliberately tiny — no LRU dep, no metrics. ~500 entry hard cap with
 * naive eviction (oldest by insertion order) is enough for the auth surface.
 */
import { prisma } from "@repo/db";

export type ActiveUserRecord = { id: string; role: string };

interface CacheEntry {
  result: ActiveUserRecord | null;
  expiresAt: number;
}

const TTL_MS = 30_000; // 30s; aligned with the upper bound called out in AUD-021.
const MAX_ENTRIES = 500;

// Map preserves insertion order so the first-inserted key is the natural
// eviction candidate when we hit MAX_ENTRIES.
const cache = new Map<string, CacheEntry>();

function pruneIfNeeded(): void {
  if (cache.size <= MAX_ENTRIES) return;
  // Evict the oldest ~10% so we don't thrash on every insert past the cap.
  const toEvict = Math.max(1, Math.floor(MAX_ENTRIES * 0.1));
  let removed = 0;
  for (const key of cache.keys()) {
    cache.delete(key);
    if (++removed >= toEvict) break;
  }
}

/**
 * Resolve the user by id, returning `{ id, role }` when the user exists and
 * is not soft-deleted, or `null` otherwise. Results are cached for TTL_MS.
 */
export async function lookupActiveUser(
  userId: string,
): Promise<ActiveUserRecord | null> {
  const now = Date.now();
  const hit = cache.get(userId);
  if (hit && hit.expiresAt > now) {
    return hit.result;
  }
  if (hit) {
    // Expired — remove so the re-insert below resets insertion order
    // for eviction purposes.
    cache.delete(userId);
  }

  const row = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, role: true },
  });

  const result: ActiveUserRecord | null = row ? { id: row.id, role: row.role } : null;
  cache.set(userId, { result, expiresAt: now + TTL_MS });
  pruneIfNeeded();
  return result;
}

/**
 * Invalidate a cached entry — call this from any code that mutates the
 * user's lifecycle bits we track (role change, soft-delete, restore) so
 * the next request sees the truth without waiting for TTL.
 */
export function invalidateUserCache(userId: string): void {
  cache.delete(userId);
}

/** Test helper — clears every entry. */
export function _clearUserCacheForTests(): void {
  cache.clear();
}
