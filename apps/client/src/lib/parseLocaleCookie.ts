// Pure cookie parsing extracted from `./localeCookie.ts` so it can be unit
// tested under `node --experimental-strip-types --test` without pulling in
// path-aliased modules. See `./localeCookie.ts` for the runtime wrapper that
// binds this helper to next-intl's routing config.

// next-intl's default locale cookie name. apps/client/src/i18n/routing.ts does
// not override `localeCookie`, so the library default applies.
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

/**
 * Parse the next-intl locale cookie out of a `document.cookie`-style string.
 * Returns `defaultLocale` when the cookie is absent or the value is not in
 * `locales`.
 */
export function parseLocaleCookie(
  cookieString: string,
  locales: readonly string[],
  defaultLocale: string,
): string {
  const match = cookieString
    .split("; ")
    .find((row) => row.startsWith(`${LOCALE_COOKIE_NAME}=`));
  const value = match
    ? decodeURIComponent(match.slice(LOCALE_COOKIE_NAME.length + 1))
    : "";
  return locales.includes(value) ? value : defaultLocale;
}
