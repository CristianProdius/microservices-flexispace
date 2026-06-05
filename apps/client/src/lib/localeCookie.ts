import { routing } from "@/i18n/routing";
import {
  LOCALE_COOKIE_NAME,
  parseLocaleCookie,
} from "./parseLocaleCookie";

export { LOCALE_COOKIE_NAME, parseLocaleCookie };

/**
 * Browser-safe locale lookup. Reads `document.cookie` when available and falls
 * back to `routing.defaultLocale` on the server (where this should not be
 * called, but we degrade gracefully rather than throw).
 */
export function readLocaleFromCookie(): string {
  if (typeof document === "undefined") return routing.defaultLocale;
  return parseLocaleCookie(
    document.cookie,
    routing.locales,
    routing.defaultLocale,
  );
}
