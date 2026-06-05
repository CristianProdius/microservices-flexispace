# Slice 01 — apps/client

**Scope:** apps/client (Next.js public app)
**Files reviewed:** 84
**Findings:** 22

---

## CLIENT-001 — Locale detection is fundamentally broken because `localePrefix: "never"`

- **Severity:** high
- **Category:** i18n
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/client/src/components/SpaceListBrowse.tsx` lines 58, 137, 179; `apps/client/src/stores/authStore.ts` lines 126–127
- **Symbol:** `SpaceListBrowse.loadMore`, `SpaceListBrowse.fetchMapSpaces`, `authStore.handleSessionExpired`

**Root cause:** `apps/client/src/i18n/routing.ts` sets `localePrefix: "never"`, so URL paths never contain a locale segment (e.g. `/spaces`, `/hosts/123`). Four call-sites compute the user's locale from `window.location.pathname.split("/")[1] || "en"`. With `localePrefix: "never"` that first segment is the *page name* (e.g. `"spaces"`, `"hosts"`, `"bookings"`), never `"ro" | "ru" | "en"`. The `|| "en"` only triggers when the segment is empty.

**Impact:** (1) Client-side load-more pagination on `/spaces` passes `lang=spaces` (or `lang=hosts`, etc.) to the product service, so additional pages return data in the backend's default language instead of the user's selected locale — users see a language switch as soon as they scroll past the first page. (2) Map-bounds fetches have the same problem. (3) The session-expired toast in `handleSessionExpired` always falls back to the English string because `messages["spaces"]` is `undefined`, so Romanian/Russian users always see the English "Your session has expired" toast.

**Fix plan:** Replace the path-parsing logic with the `useLocale()` hook from `next-intl` (already used elsewhere in `ReviewSection.tsx`). For `authStore.handleSessionExpired`, read the locale from the next-intl cookie or accept a locale argument from the caller. The cache key in `SpaceListBrowse` should also use the real locale to prevent cross-locale cache poisoning.

---

## CLIENT-002 — "Today" bookings show up under "Past" in negative timezones

- **Severity:** high
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/client/src/app/[locale]/(main)/bookings/page.tsx` lines 137–158
- **Symbol:** `BookingsPage.filteredBookings`

**Root cause:** `bookingDate = new Date(booking.startDate)` parses the `YYYY-MM-DD` string as **UTC midnight**, while `today = new Date(); today.setHours(0,0,0,0)` is **local midnight**. In any negative timezone (e.g. PST = UTC-8), `today` in UTC is ahead of `bookingDate` for a booking that starts "today" by the user's calendar, so the comparison `bookingDate >= today` returns `false` and the booking is routed into the "past" tab.

**Impact:** Western Hemisphere users will not see their same-day bookings under "Upcoming"; they appear under "Past", which also restricts the actions available (e.g. cancel button hidden via the date-derived branches). High-confusion bug for the core booking-management flow.

**Fix plan:** Compare on date-strings or normalize both sides to the same timezone — for example, compare `booking.startDate` (already `YYYY-MM-DD`) with `new Date().toISOString().slice(0,10)`, or build `bookingDate` from year/month/day components rather than from the ISO parser.

---

## CLIENT-003 — Debounced search overwrites the user's in-flight typing in `HostFilter`

- **Severity:** high
- **Category:** race-condition
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/client/src/components/HostFilter.tsx` lines 57–85
- **Symbol:** `HostFilter`

**Root cause:** `searchDraft` is local state. A 300 ms debounce calls `writeParam("search", value.trim())` which does `router.replace(...)`. Once the URL settles, `activeSearch = searchParams.get("search")` changes, and the `useEffect(() => setSearchDraft(activeSearch), [activeSearch])` at lines 60–62 unconditionally overwrites whatever the user has typed since the debounce fired.

**Impact:** Fast typists lose characters mid-typing. Typing "London" can yield "Lon" in the input because the URL update fires after "Lon" and resets `searchDraft` while the user is on the "d". Search becomes effectively unusable above slow typing speeds.

**Fix plan:** Drop the `useEffect` sync entirely (the input is already controlled by local state — the URL is downstream of typing, not the other way round). If syncing on back/forward navigation is needed, gate it: only sync when the URL change was *not* triggered by the user's own input (e.g. compare against the most recent value the component itself wrote).

---

## CLIENT-004 — `BookingsPage` uses UTC vs local-midnight comparison cancel ripple

- **Severity:** medium
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** medium
- **File:** `apps/client/src/app/[locale]/(main)/spaces/[id]/BookingForm.tsx` line 94
- **Symbol:** `BookingForm.minDate`

**Root cause:** `const minDate = new Date().toISOString().split("T")[0]` produces today's date **in UTC**. For users in positive timezones (e.g. UTC+9, Tokyo) after ~3 PM local, this is *tomorrow's* date locally; for negative timezones early in the day it's *yesterday*. Combined with CLIENT-002 this means the calendar can disallow booking "today" or allow booking "yesterday" depending on local time.

**Impact:** Bookings for the current day can become impossible during the evening in eastern timezones. Conversely, a stale past day can sneak in for far-west timezones.

**Fix plan:** Derive today from local components: `const d = new Date(); minDate = \`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}\`;`.

---

## CLIENT-005 — `FeaturedSpaceCard` price label decoupled from `pricingType` and ignores currency

- **Severity:** medium
- **Category:** data-integrity
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/client/src/components/FeaturedSpaceCard.tsx` lines 47–48, 96–99
- **Symbol:** `FeaturedSpaceCard`

**Root cause:** The card derives price as `space.pricePerHour ?? space.pricePerDay` and the label from `space.pricePerHour ? "perHour" : "perDay"`, ignoring `pricingType` entirely. It then renders `${price}` with a hard-coded `$` instead of going through `formatPrice`, so EUR/MDL spaces render with the wrong currency symbol. Additionally, if `pricePerHour === 0` the `??` keeps the `0` but the label flips to `"perDay"` (label says "per day", price shows `$0` from the hourly slot).

**Impact:** Wrong currency symbol for non-USD spaces; wrong unit label for DAILY-only spaces that happen to also have an hourly price set, or for spaces where `pricePerHour === 0`. Inconsistent with `getPriceDisplay` used everywhere else in the app.

**Fix plan:** Reuse `getPriceDisplay(space)` from `@/lib/utils` instead of rolling a bespoke price selector. Drop the hard-coded `$`.

---

## CLIENT-006 — `NEXT_PUBLIC_ORDER_SERVICE_URL` has no fallback; missing env yields `undefined/bookings/...`

- **Severity:** medium
- **Category:** error-handling
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/client/src/app/[locale]/(main)/bookings/page.tsx` line 121; `apps/client/src/app/[locale]/(main)/bookings/checkout/page.tsx` line 43; `apps/client/src/app/[locale]/(main)/bookings/[id]/page.tsx` lines 137, 161

**Root cause:** Every other service URL has a `|| "http://..."` fallback (see `lib/config.ts`, `lib/auth.ts`, `become-host/page.tsx`). The four order-service callsites use raw `process.env.NEXT_PUBLIC_ORDER_SERVICE_URL` with no fallback. When the build environment is misconfigured the string becomes `undefined/bookings/my`, producing requests against the current origin like `/undefined/bookings/my` — a 404 with no useful error.

**Impact:** A misconfigured deployment silently breaks all booking flows (list, detail, checkout, cancel) with confusing 404s instead of a clear error.

**Fix plan:** Add a single `ORDER_SERVICE_URL` constant to `lib/config.ts` with a localhost fallback (mirroring `PRODUCT_SERVICE_URL`) and import it from the four pages. At minimum add `|| "http://localhost:8001"` inline.

---

## CLIENT-007 — Open-redirect mitigation breaks legitimate localized return paths

- **Severity:** low
- **Category:** security
- **Verdict:** real
- **Confidence:** medium
- **File:** `apps/client/src/app/[locale]/(auth)/login/page.tsx` lines 30–35; `register/page.tsx` lines 53–58
- **Symbol:** `LoginPage.handleSubmit`, `RegisterPage.handleSubmit`

**Root cause:** The guard `redirectTo?.startsWith("/") && !redirectTo.startsWith("//")` is correct for blocking protocol-relative URLs. However it does **not** validate the path against the app's known routes — a redirect like `/.well-known/…` or any handcrafted external static asset path is accepted. More importantly, `router.push` here is the next-intl router and treats arbitrary strings as i18n hrefs; passing in a URL containing a query string (e.g. `/bookings?ref=xyz`) is fine, but anything containing `..` or backslashes is silently passed through. Backslashes in URLs are interpreted as `/` by browsers, so `/\evil.com` is normalized to `//evil.com` which the guard does not catch.

**Impact:** A crafted `?redirect=/\\evil.com` (URL-encoded `/%5Cevil.com`) bypasses the `startsWith("//")` check and can be normalized by some browsers into a cross-origin redirect post-login/register.

**Fix plan:** Use `new URL(redirectTo, window.location.origin)` and verify `.origin === window.location.origin` before redirecting; reject anything that contains `\\`, `\`, or `://` before parsing.

---

## CLIENT-008 — Tokens in `localStorage` are vulnerable to XSS exfiltration

- **Severity:** medium
- **Category:** security
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/client/src/lib/auth.ts` lines 109–155
- **Symbol:** `saveTokens`, `getAccessToken`, `getRefreshToken`, `getStoredUser`

**Root cause:** Access tokens *and* long-lived refresh tokens are persisted in `localStorage`. Any successful XSS — including from a host-uploaded YouTube embed thumbnail, a misconfigured third-party script, or a future `dangerouslySetInnerHTML` — can read both tokens and impersonate the user indefinitely until the refresh token expires server-side.

**Impact:** Standard XSS-to-account-takeover exposure. The blast radius is amplified because the *refresh* token is in `localStorage`, not just the access token, so an attacker only needs a one-shot exfil to maintain access.

**Fix plan:** Move refresh tokens to an HttpOnly, Secure, SameSite=Lax cookie set by the auth service. Keep access tokens in memory only (Zustand state), refreshing on app load via the cookie. This requires coordinated changes to `auth-service` but is the standard hardening pattern.

---

## CLIENT-009 — Booking calendar's `inclusiveDayCount` always charges N+1 days (treats checkout as a billable night)

- **Severity:** medium
- **Category:** data-integrity
- **Verdict:** unclear
- **Confidence:** medium
- **File:** `apps/client/src/lib/booking-pricing.ts` lines 43–48
- **Symbol:** `inclusiveDayCount`

**Root cause:** `Math.ceil((end-start)/DAY_MS) + 1` — for `startDate = 2024-01-01`, `endDate = 2024-01-02` this returns 2 days. Most lodging conventions price by *nights* (1 night = 1 day of charge between checkin and checkout). Backend (`apps/order-service/src/routes/booking.ts:185`) uses the same `+1` convention so client and server agree, but if business intent was "nights" the customer is over-billed by one day on every multi-day booking.

**Impact:** If the product intent is "1 day = 24h between checkin and checkout" then the user pays 2× the expected price for a single overnight stay. If the product intent is "calendar days inclusive" then this is correct. Worth confirming with product because the BookingForm UI shows "Check-in / Check-out" labels (which conventionally imply nights).

**Fix plan:** Confirm semantic with product. If nights are intended, drop the `+1` in both client and server. If days inclusive are intended, clarify in the booking summary copy ("includes checkout day") to avoid customer surprise.

---

## CLIENT-010 — `parseImages` in `SpaceMapPin` doesn't reuse the stringified-array handler

- **Severity:** low
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/client/src/components/SpaceMapPin.tsx` line 21
- **Symbol:** `SpaceMapPin`

**Root cause:** `const images = Array.isArray(space.images) ? space.images : [];` only handles array; the rest of the app uses `parseImages` which also accepts a stringified JSON array (Prisma `Json` columns sometimes serialize that way). If the API returns the images field as a string, the map pin renders no image while `SpaceCard` renders fine.

**Impact:** Inconsistent image rendering in map popups vs. cards for the same space if/when the upstream payload comes through as a string.

**Fix plan:** Replace with `parseImages(space.images)` from `@/lib/utils` for consistency.

---

## CLIENT-011 — Lightbox cleanup `img.src = ""` triggers a spurious request to the page URL

- **Severity:** low
- **Category:** performance
- **Verdict:** real
- **Confidence:** medium
- **File:** `apps/client/src/components/Lightbox.tsx` lines 65–67
- **Symbol:** `Lightbox` preload cleanup

**Root cause:** Setting `img.src = ""` does **not** abort an in-flight image fetch — instead it triggers the browser to load the current document URL as an image (because the empty string is resolved against the page). This is a long-standing browser behavior.

**Impact:** Each Lightbox cleanup fires a duplicate page-document request which the browser tries to decode as an image, producing console errors and unnecessary bandwidth. Visible to users with the network tab open.

**Fix plan:** Use `img.removeAttribute("src")` or simply drop the cleanup loop — the `HTMLImageElement` objects are not appended to the DOM and will be GC'd when `preloaded` falls out of scope.

---

## CLIENT-012 — `useEffect` deps missing `fetchBooking` / `fetchBookings` (eslint-react-hooks would flag)

- **Severity:** low
- **Category:** other
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/client/src/app/[locale]/(main)/bookings/page.tsx` lines 107–116; `apps/client/src/app/[locale]/(main)/bookings/[id]/page.tsx` lines 123–132
- **Symbol:** `BookingsPage`, `BookingDetailPage`

**Root cause:** `useEffect(() => { ... fetchBookings(); }, [authLoading, isAuthenticated, token, router])`. The arrow function `fetchBookings` is re-created every render; the effect dep list omits it. This is a stable case in practice because `fetchBookings` only reads `process.env` and React state setters, so the stale closure is harmless — but the pattern hides future refactor hazards (if `fetchBookings` were to start reading other state, the cached closure would be stale).

**Impact:** Currently benign. Subtle bug-magnet for future changes.

**Fix plan:** Either wrap the fetcher in `useCallback` with proper deps and include it in the effect, or inline the fetch body in the effect.

---

## CLIENT-013 — `ProfileButton`/`MobileMenu`/`NavbarV4` disagree about who counts as a host

- **Severity:** low
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/client/src/components/ProfileButton.tsx` line 20; `apps/client/src/components/navbar/MobileMenu.tsx` line 18; `apps/client/src/components/navbar/NavbarV4.tsx` line 67; `apps/client/src/app/[locale]/(main)/become-host/page.tsx` line 30
- **Symbol:** various `isHost` checks

**Root cause:** `ProfileButton` and `MobileMenu` treat ADMIN as a host (`role === "HOST" || role === "ADMIN"`), but `NavbarV4` renders the dashboard link only for `role === "HOST"`. Symmetrically, `become-host/page.tsx` only redirects existing hosts away if `role === "HOST"` — an ADMIN visiting `/become-host` is not redirected.

**Impact:** Inconsistent UX for admin accounts (no nav link, but profile menu and become-host page disagree). Not customer-facing but a maintenance footgun.

**Fix plan:** Extract `isHost = role === "HOST" || role === "ADMIN"` to a single helper (e.g. on the auth store or a tiny `lib/roles.ts`) and use everywhere.

---

## CLIENT-014 — `BookingForm` start-time dropdown excludes 23:00, end-time dropdown excludes 24:00 sentinel

- **Severity:** low
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/client/src/app/[locale]/(main)/spaces/[id]/BookingForm.tsx` lines 201, 222
- **Symbol:** `BookingForm` time-select options

**Root cause:** Start-time options: `Array.from({ length: 23 }, ...)` produces 00:00–22:00, missing 23:00 — though arguably intended because a 23:00 start has no valid endpoint within the same day. End-time options: `Array.from({ length: 24 - startHour - 1 }, ...)` produces `startHour+1` through `23`, but cannot represent "until midnight" (24:00). A user who wants to book 22:00 → 00:00 cannot.

**Impact:** Late-evening single-hour bookings ending at midnight are impossible.

**Fix plan:** Either explicitly add a 23:59 or 00:00 (next-day) end option, or document the booking window as strictly intra-calendar-day with a tooltip.

---

## CLIENT-015 — `useAuthStore.initialize` doesn't update `localStorage` when refresh succeeds with a new refresh token

- **Severity:** low
- **Category:** data-integrity
- **Verdict:** real
- **Confidence:** medium
- **File:** `apps/client/src/stores/authStore.ts` lines 38–63; `apps/client/src/lib/auth.ts` lines 79–92
- **Symbol:** `authStore.initialize`, `refreshAccessToken`

**Root cause:** `refreshAccessToken` only returns `accessToken`, not `refreshToken`. `initialize` calls `saveTokens(newToken, refreshToken)` reusing the *old* refresh token. If the backend rotates refresh tokens (recommended for security), the next refresh after this one will fail because the old refresh token has been invalidated.

**Impact:** Sessions silently invalidate after a single refresh cycle if the auth service rotates refresh tokens. Currently the auth service may or may not rotate — but the client cannot handle it if/when rotation is enabled.

**Fix plan:** Have `refreshAccessToken` return `{ accessToken, refreshToken }` and persist whichever the server returned. Backend changes needed in lockstep.

---

## CLIENT-016 — `setSuccess` and `clearDraft` in checkout fire before the navigation completes, then the empty-draft effect redirects away

- **Severity:** medium
- **Category:** race-condition
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/client/src/app/[locale]/(main)/bookings/checkout/page.tsx` lines 23–34, 63–64
- **Symbol:** `CheckoutPage`

**Root cause:** After a successful booking, `clearDraft()` is called (which sets `draft = null` in the store), then `setSuccess(true)`. The `useEffect` at lines 23–27 watches `draft` and pushes the user to `/spaces` when it goes null. The state updates batch so the success screen *may* render, but on slower devices or in StrictMode double-effect the redirect can fire before the success message renders.

**Impact:** Some users may briefly see the success screen and then be redirected to `/spaces` instead of being able to click "View my bookings"; in the worst case the success screen never renders.

**Fix plan:** Either set `success` before clearing the draft, or gate the empty-draft redirect on `!success` (`if (hasHydrated && !draft && !success)`).

---

## CLIENT-017 — `FAQ` injects `JSON.stringify` schema data via `dangerouslySetInnerHTML` without sanitization

- **Severity:** low
- **Category:** security
- **Verdict:** false_positive
- **Confidence:** high
- **File:** `apps/client/src/components/landing/FAQ.tsx` lines 50–53
- **Symbol:** `FAQ`

**Root cause:** JSON.stringify produces JSON which is safe as `application/ld+json` content. Strings inside the FAQ translations come from the locked-down `messages/*.json` files (translator-controlled, not user-controlled), so `</script>` injection requires a translator to deliberately attack. Worth noting but not exploitable in practice.

**Impact:** Negligible — translations are part of the source tree.

**Fix plan:** Optionally escape `</` to `<\/` in the stringified JSON to defense-in-depth. Not blocking.

---

## CLIENT-018 — Cleanup loop in `apiClient.fetchWithAuth` 401-retry can leak in-flight refresh state across concurrent requests

- **Severity:** medium
- **Category:** race-condition
- **Verdict:** real
- **Confidence:** medium
- **File:** `apps/client/src/lib/apiClient.ts` lines 53–84
- **Symbol:** `fetchWithAuth` 401-retry branch

**Root cause:** When a GET hits 401, the function `await`s any in-flight `refreshPromise`, then **unconditionally** sets `isRefreshing = false; refreshPromise = null;` before calling `getValidToken()`. If two concurrent GETs both hit 401, the second one's `await refreshPromise` completes, it nukes the module-level state, then calls `getValidToken()` which sees a now-expired token (because the refresh just finished and saved a new one, but the second caller already proceeded past the check)... actually on closer inspection the saved token is fine. But the explicit nulling means a *third* concurrent GET arriving mid-cleanup starts a fresh refresh even though one just completed, causing duplicate `/auth/refresh` POSTs.

**Impact:** Under bursty 401s, multiple refresh calls fire. Most auth services rotate-on-refresh, so the second call fails and the user is logged out spuriously.

**Fix plan:** Don't clear `isRefreshing/refreshPromise` manually in `fetchWithAuth`; let the `getValidToken` IIFE's `finally` block be the single owner. Call `getValidToken()` directly and rely on its own dedup.

---

## CLIENT-019 — `SpaceListBrowse` sessionStorage cache races with rapid filter changes

- **Severity:** low
- **Category:** race-condition
- **Verdict:** real
- **Confidence:** medium
- **File:** `apps/client/src/components/SpaceListBrowse.tsx` lines 91–108, 111–123
- **Symbol:** `SpaceListBrowse`

**Root cause:** The "save to sessionStorage" effect (lines 91–108) writes whenever `spaces`/`page`/`total` change. The "reset on filter change" effect (lines 111–123) resets `spaces` to `initialSpaces` when `searchParams` changes. Between these two firing, the save-effect may persist the *old* filter's spaces under the *new* cache key (because `cacheKey` updates synchronously with searchParams, but state hasn't reset yet), polluting the new filter's cache with stale data.

**Impact:** Browsing back from a space-detail page with the new filter applied may show a flash of the old filter's spaces from the corrupted cache.

**Fix plan:** Track the "owning" cache key per persisted snapshot — either include the cache key as a write-time invariant ref, or skip the save-effect on the first render after a searchParams change.

---

## CLIENT-020 — `apiClient.fetchWithAuth` returns the 401 response without consuming it, masking the error to the caller

- **Severity:** low
- **Category:** error-handling
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/client/src/lib/apiClient.ts` lines 53–74
- **Symbol:** `fetchWithAuth`

**Root cause:** On a non-idempotent 401, the function calls `handleSessionExpired()` (which navigates) but still `return response;`. The caller (e.g. `checkout/page.tsx`) then calls `await bookingRes.json()`. The user is being navigated away, so this may or may not complete; if it does, the error message shown is the auth error, not the actual booking-creation error.

**Impact:** Confusing error UX during expired-session checkout attempts.

**Fix plan:** Throw a sentinel error when navigating to login so callers know to abort, instead of returning the response.

---

## CLIENT-021 — `LocationMap`'s Leaflet `MapContainer` props are not reactive

- **Severity:** low
- **Category:** other
- **Verdict:** real
- **Confidence:** medium
- **File:** `apps/client/src/app/[locale]/(main)/spaces/[id]/LocationMap.tsx` lines 31–46
- **Symbol:** `LocationMap`

**Root cause:** `react-leaflet` `<MapContainer center=...>` is **only** read on mount. If the same component re-renders with new coordinates (rare here since the parent is a server component and full nav, but possible via fast nav with shared component tree), the map stays on the old coordinates.

**Impact:** Stale map on certain client-side navigations between space-detail pages.

**Fix plan:** Use the `useMap()` hook plus `map.setView([lat,lng])` in a `useEffect` to react to prop changes.

---

## CLIENT-022 — `ImageGallery` "show all photos" button always opens at index 0

- **Severity:** low
- **Category:** accessibility
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/client/src/components/ImageGallery.tsx` lines 77–85
- **Symbol:** `ImageGallery`

**Root cause:** The badge says "show all N photos" but `onClick={() => openLightbox(0)}` always opens to image 0, not to the first unseen image or to a grid overview. With the grid already showing images 0–4, clicking "show all" to land back on image 0 is non-intuitive.

**Impact:** Minor UX confusion — users expect to see additional photos when clicking this badge, but they land on the first photo they already saw.

**Fix plan:** Open at index 5 (first unseen) or implement a true overview/grid view mode in the Lightbox.

---
