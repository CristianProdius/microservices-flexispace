/**
 * Parse and validate a CORS origins env value (comma-separated).
 *
 * Rules:
 * - Trim whitespace and trailing slashes from each entry.
 * - Reject "*" (would combine with `credentials: true` to expose everything).
 * - Outside localhost / 127.0.0.1, require https:// (plain http would leak
 *   credentialed cookies over the wire).
 * - Rejected entries are logged via the supplied logger and skipped.
 */
export interface ParseCorsOriginsOptions {
  logger?: Pick<Console, "warn">;
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function parseCorsOrigins(
  value: string | undefined | null,
  options: ParseCorsOriginsOptions = {}
): string[] {
  const logger = options.logger ?? console;
  if (!value) return [];

  const seen = new Set<string>();
  const accepted: string[] = [];

  for (const raw of value.split(",")) {
    const trimmed = raw.trim().replace(/\/+$/, "");
    if (!trimmed) continue;

    if (trimmed === "*") {
      logger.warn(
        `[cors] Rejecting wildcard origin "*" — incompatible with credentials:true.`
      );
      continue;
    }

    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      logger.warn(`[cors] Rejecting unparseable origin "${trimmed}".`);
      continue;
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      logger.warn(
        `[cors] Rejecting non-http(s) origin "${trimmed}" (protocol ${url.protocol}).`
      );
      continue;
    }

    const isLocal = LOCAL_HOSTS.has(url.hostname);
    if (url.protocol === "http:" && !isLocal) {
      logger.warn(
        `[cors] Rejecting non-https origin "${trimmed}" — only localhost may use http.`
      );
      continue;
    }

    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    accepted.push(trimmed);
  }

  return accepted;
}
