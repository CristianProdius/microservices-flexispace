/**
 * Validate a `next` redirect target arriving from the middleware via a query
 * string. We only accept relative same-origin paths and refuse anything that
 * could be coaxed into an open redirect:
 *
 *  - `null` / empty -> null
 *  - must start with a single `/`
 *  - cannot start with `//` (protocol-relative URL)
 *  - cannot contain `\` (some browsers treat as `/`)
 *  - cannot contain `://`
 *  - we also strip / reject any `next=` chaining inside the value to keep
 *    attackers from smuggling a second redirect target through ours.
 */
export function safeRedirectPath(raw: string | null): string | null {
  if (raw == null) return null;
  const value = raw.trim();
  if (value === "") return null;

  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.includes("\\")) return null;
  if (value.includes("://")) return null;

  // Reject any attempt to chain another `next=` inside the value — this
  // prevents nested-redirect smuggling through legitimate-looking paths.
  const lowered = value.toLowerCase();
  if (lowered.includes("next=")) return null;

  return value;
}
