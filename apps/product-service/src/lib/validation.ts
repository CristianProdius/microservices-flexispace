export const parsePositiveInteger = (value: unknown) => {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

export const parsePositiveIntegerWithDefault = (value: unknown, fallback: number, max?: number) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = parsePositiveInteger(String(value));
  if (parsed === null) return null;
  return max ? Math.min(parsed, max) : parsed;
};

export const isDateOnlyOrIsoDate = (value: unknown) => {
  if (typeof value !== "string" || value.trim() === "") return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

export const parseRating = (value: unknown) => {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  return value >= 1 && value <= 5 ? value : null;
};

const ALLOWED_VIDEO_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
]);

/**
 * Validates that a value is a safe https YouTube URL. Returns true for
 * `https://youtube.com/...`, `https://www.youtube.com/...`, or
 * `https://youtu.be/...`. Rejects other schemes (incl. `javascript:`),
 * other hosts (e.g. `https://evil.com/youtube.com/...`), and arbitrary
 * subdomains. Empty/null/undefined values are considered valid so that
 * callers can short-circuit on optional fields.
 */
export const isValidYouTubeUrl = (value: unknown): boolean => {
  if (value === undefined || value === null || value === "") return true;
  if (typeof value !== "string") return false;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  return ALLOWED_VIDEO_HOSTS.has(parsed.host.toLowerCase());
};
