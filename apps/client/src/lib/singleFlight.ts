/**
 * Wrap an async producer so that overlapping callers share a single
 * in-flight invocation. Once the underlying promise settles, the cached
 * promise is cleared so a subsequent call starts a fresh invocation.
 *
 * This is the dedup primitive behind apiClient's POST /auth/refresh: when
 * a wave of requests all see expired-or-rejected tokens, exactly one
 * refresh hits the network and every caller gets that result. This avoids
 * triggering rotate-on-refresh logout cascades in the auth service.
 */
export function createSingleFlight<T>(producer: () => Promise<T>): () => Promise<T> {
  let inflight: Promise<T> | null = null;

  return () => {
    if (inflight) return inflight;
    inflight = (async () => {
      try {
        return await producer();
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  };
}
