/**
 * Issues DELETE /users/:id for every supplied id in parallel, aggregates
 * per-id success/failure, and throws a descriptive error if any request was
 * rejected by the backend.
 *
 * Extracted from the data-table mutation so it can be unit tested without
 * mounting the full table + React Query runtime.
 */
export interface DeleteUsersOptions {
  baseUrl: string;
  token: string | null | undefined;
  ids: string[];
  // Injectable for tests; defaults to the global fetch.
  fetchImpl?: typeof fetch;
}

export interface DeleteUsersResult {
  successCount: number;
}

export async function deleteUsers({
  baseUrl,
  token,
  ids,
  fetchImpl,
}: DeleteUsersOptions): Promise<DeleteUsersResult> {
  const doFetch: typeof fetch = fetchImpl ?? fetch;

  const settled = await Promise.allSettled(
    ids.map(async (id) => {
      const response = await doFetch(`${baseUrl}/users/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} ${response.statusText || ""}`.trim()
        );
      }

      return id;
    })
  );

  const failures: { id: string; reason: string }[] = [];
  let successCount = 0;

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successCount += 1;
    } else {
      const reason =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      failures.push({ id: ids[index]!, reason });
    }
  });

  if (failures.length > 0) {
    const sample = failures[0]!;
    const summary =
      failures.length === ids.length
        ? `Failed to delete ${failures.length} user(s): ${sample.reason}`
        : `Deleted ${successCount} user(s); ${failures.length} failed (e.g. ${sample.reason})`;
    throw new Error(summary);
  }

  return { successCount };
}
