# Slice 02 — apps/admin

**Scope:** apps/admin (Next.js admin/host dashboard)
**Files reviewed:** 47
**Findings:** 22

---

## ADMIN-001 — `getToken` refreshes the access token on every call

- **Severity:** critical
- **Category:** race-condition
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/admin/src/stores/authStore.ts` lines 111–138
- **Symbol:** `useAuthStore.getToken`

**Root cause:** `getToken` unconditionally calls `auth.refreshAccessToken(refreshToken)` and persists the rotated token on every invocation, regardless of whether the current access token is still valid. Almost every authenticated page calls `getToken()` immediately in a `useCallback` that runs on mount, and several pages (host dashboard, host bookings, host spaces) call it again per user action.
**Impact:** (1) Every dashboard page issues an extra round trip to `auth-service:8003/auth/refresh` before any data fetch — multiplying auth-service load and adding latency to every screen. (2) If `auth-service` enforces single-use refresh tokens (the standard rotation pattern, used by most JWT setups), parallel calls — e.g. host dashboard simultaneously fetching `/spaces/host/my` and `/bookings/host`, or any page that fires two `getToken()`s in parallel — race: one wins, the loser invalidates the refresh token, and the `catch` block on line 132 silently calls `get().logout()` and returns `null`. The user is bounced to `/login` mid-session for no visible reason. (3) On every keystroke-triggered mutation (e.g. `AddCategory`, `AddUser`, exchange-rates save) a new refresh round trip occurs. The "happy path" `try/catch` swallows refresh failures and forces logout, hiding the root cause from the user.
**Fix plan:** Decode/track access token expiry (`exp` claim) and only call `/auth/refresh` when the current token is within a short window of expiring or already expired. Serialize concurrent refresh attempts with a single in-flight promise so simultaneous callers share the same refreshed token. Surface a real error (don't just `return null` from a getter named `getToken`) when refresh fails so callers can distinguish "no session" from "auth service down".

---

## ADMIN-002 — Admin user-delete bulk mutation reports success on HTTP failure

- **Severity:** high
- **Category:** error-handling
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/admin/src/app/(dashboard)/admin/users/data-table.tsx` lines 68–96
- **Symbol:** `DataTable.mutation`

**Root cause:** `mutationFn` issues `DELETE /users/:id` for every selected row via `Promise.all`, but never checks `response.ok`. As long as the network call resolves (even with 401/403/404/500), the promise resolves and `onSuccess` fires.
**Impact:** Admin selects users, clicks "Delete User(s)", and sees a green toast "User(s) deleted successfully" even when the backend rejected every request (e.g. expired token, permission failure, FK constraint). The row selection is cleared and `router.refresh()` does nothing useful (the page reads users from client state, not RSC), so the deleted-looking rows reappear on next navigation, eroding admin trust.
**Fix plan:** In `mutationFn`, throw if `!response.ok`. Aggregate per-row success/failure and either surface a partial-failure toast or invalidate a React Query cache and refetch. Also trigger an actual refetch of the users list (e.g. via `fetchUsers()` callback prop) instead of `router.refresh()`.

---

## ADMIN-003 — Middleware is a no-op; nothing enforces authn/authz on /admin or /host routes server-side

- **Severity:** high
- **Category:** authz
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/admin/src/middleware.ts` lines 1–12
- **Symbol:** `middleware`

**Root cause:** The Next.js middleware returns `NextResponse.next()` for every matched path. All admin/host gating is performed client-side by `AdminLayout` / `HostLayout` reading `localStorage`. The (dashboard) parent layout is a server component with no auth check.
**Impact:** Anyone — including search-engine crawlers and unauthenticated visitors — can GET the server-rendered HTML shell of `/admin/users`, `/admin/spaces`, `/host/bookings`, etc. While the *data* is fetched client-side with bearer tokens (so PII leakage is bounded), it leaks the admin information architecture, every internal route name, sidebar copy, and the entire admin nav (since `AppSidebar` renders before `AdminLayout`'s client gate). In a dev environment with the `cookies()`-based `defaultOpen` lookup, the unauthenticated render still happens. Combined with the client-only gate, a flash-of-protected-content also occurs for legitimately authenticated users on every navigation. There is also no defense against a user manually setting `localStorage.admin_user = '{"role":"ADMIN"}'` to make the UI render admin chrome — backend endpoints still gate, but every "view" affordance becomes visible.
**Fix plan:** Either (a) move auth into a real edge `middleware.ts` that reads an HttpOnly cookie set at login and 302s to `/login` when missing/invalid, then keep the client gates as a defense-in-depth layer, or (b) at minimum convert `(dashboard)/layout.tsx`, `/admin/layout.tsx`, `/host/layout.tsx` into server components that read the session cookie and call `redirect("/login")` from RSC. The current localStorage-only approach also blocks SSR forever (no SSR auth context).

---

## ADMIN-004 — Tokens stored in localStorage, vulnerable to any XSS

- **Severity:** high
- **Category:** security
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/admin/src/lib/auth.ts` lines 75–120
- **Symbol:** `saveTokens`, `getAccessToken`, `getRefreshToken`

**Root cause:** Access and refresh tokens are persisted via `localStorage.setItem`, making them readable by any JavaScript running in the origin (including XSS, dependency supply chain, browser extensions). The admin app also injects user-supplied content (e.g. `user.image` via `<Image>` and arbitrary `videoUrl` strings) and pastes them into rendering paths.
**Impact:** A single stored XSS — or compromised third-party script (Recharts, Leaflet, react-toastify, etc.) — can exfiltrate both tokens. Refresh tokens grant long-lived account takeover for admins and hosts. The dashboard handles financial and PII data.
**Fix plan:** Move auth tokens to HttpOnly, Secure, SameSite=Strict cookies set by the auth service (or a thin BFF in this Next.js app). The browser code can then drop `Bearer` headers and let the cookie ride. This also dovetails with ADMIN-003 (server-side auth gating) and ADMIN-001 (refresh races).

---

## ADMIN-005 — `EditUser` is a hardcoded mock with no submit handler

- **Severity:** high
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/admin/src/components/EditUser.tsx` lines 1–143
- **Symbol:** `EditUser`

**Root cause:** The component is wired into the single-user admin page (`/admin/users/[id]`) behind an "Edit User" button, but its form has no `onSubmit`, no API call, and its default values are hardcoded ("John Doe", "john.doe@gmail.com", etc.). Submitting reloads the page (default form submission) without persisting anything.
**Impact:** Admin attempts to edit any user, fills in fields, presses Submit — nothing is saved and the browser navigates. The bound user data is never loaded into the form, so the admin sees stale placeholder data for every user they open, which could be mistaken for the user's real profile.
**Fix plan:** Either remove the "Edit User" button until built, or load the actual user object as defaults, wire `form.handleSubmit` to PUT `/users/:id` on the auth service, and gate submit on `mutation.isPending`. Also align the schema with the auth-service User shape (phone/address are not on `User`).

---

## ADMIN-006 — `AddBooking` form has no submit handler

- **Severity:** medium
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/admin/src/components/AddBooking.tsx` lines 37–115
- **Symbol:** `AddBooking`

**Root cause:** The `<form>` has no `onSubmit`; pressing "Submit" submits the form and reloads/navigates without calling any API. The schema is also booking-shape-incomplete (no `spaceId`, no `startDate/endDate`, no `hostId`).
**Impact:** Wherever `AddBooking` is mounted, the affordance silently no-ops — admins believe they created a booking and don't realize nothing happened.
**Fix plan:** Either delete the unused component or implement an actual create-booking flow against `order-service`. Confirm whether admins are even supposed to create bookings directly (the order-service routes weren't reviewed in this slice).

---

## ADMIN-007 — `AddUser` exposes no role selector despite schema accepting role

- **Severity:** medium
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/admin/src/components/AddUser.tsx` lines 31–161
- **Symbol:** `AddUser`

**Root cause:** Zod schema includes `role: enum(["USER","HOST","ADMIN"])` and `defaultValues.role = "USER"`, but the form renders no field for it. The admin cannot create HOST or ADMIN accounts from this UI, and the role field is silently locked to `USER`.
**Impact:** If this form is the supposed "create admin/host user" affordance, an admin cannot onboard hosts (defeating the entire host pipeline) and cannot create admins (breaking break-glass account creation). They'd have to use the database or a separate `/users/:id/role` endpoint after the fact.
**Fix plan:** Add a role `<Select>` to the form (USER / HOST / ADMIN). Additionally, password handling for admin-created users is questionable — consider sending an invite/reset link instead of a plaintext password the admin chooses.

---

## ADMIN-008 — Bulk-delete buttons on admin Bookings and Spaces tables are wired to nothing

- **Severity:** medium
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** high
- **Files:**
  - `apps/admin/src/app/(dashboard)/admin/bookings/data-table.tsx` lines 53–60
  - `apps/admin/src/app/(dashboard)/admin/spaces/data-table.tsx` lines 53–60
- **Symbol:** `DataTable` (admin bookings + admin spaces)

**Root cause:** The "Delete Booking(s)" / "Delete Space(s)" buttons appear when rows are selected, but have no `onClick` handler. They are visually identical to the working bulk-delete button in `admin/users/data-table.tsx`.
**Impact:** Admins believe they have a bulk-delete capability — clicking does nothing, silently. Inconsistent with the users table where the same UX *does* delete (even if buggy, per ADMIN-002).
**Fix plan:** Either implement the bulk delete (with response.ok checks, see ADMIN-002) or hide the button until implemented. The selected-row state and visible button is a footgun even without the click handler.

---

## ADMIN-009 — Admin spaces list fetched without Authorization header

- **Severity:** medium
- **Category:** error-handling
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/admin/src/app/(dashboard)/admin/spaces/page.tsx` lines 29–49
- **Symbol:** `SpacesPage.fetchSpaces`

**Root cause:** `GET /spaces` is called with no `Authorization` header. The backend route `GET /spaces` is public and returns only published/active spaces in product-service (`router.get("/", getSpaces)` — no auth middleware), so the admin "All Spaces" view shows the same data a logged-out shopper sees, not the full admin inventory.
**Impact:** Admins cannot see inactive, deleted-but-soft-retained, or unpublished spaces from the "All Spaces" page. The screen is mislabelled as "All Spaces" but is actually "Public Spaces". Combined with the missing `fetchSpaces` in the `useEffect` deps (line 27), refetching on auth change won't happen either.
**Fix plan:** Either add a `GET /spaces/admin/all` endpoint that returns the full set and call it with a bearer token, or pass the token to the existing `/spaces` route and have the controller widen the result for admins.

---

## ADMIN-010 — `QueryProvider` instantiates a new `QueryClient` on every render

- **Severity:** medium
- **Category:** performance
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/admin/src/components/providers/QueryProvider.tsx` lines 1–12
- **Symbol:** `QueryProvider`

**Root cause:** `const queryClient = new QueryClient();` is created inside the component body. Every render (e.g. when SidebarProvider state changes, or whenever the QueryProvider's parent re-renders) constructs a fresh client, wiping all caches, in-flight requests, and mutation state.
**Impact:** React Query's cache is effectively disabled — every mutation/query reruns from scratch on any ancestor re-render. Symptoms: `AddCategory` / `AddUser` mutations may lose `onSuccess` callbacks mid-flight, query refetch deduping breaks, optimistic updates evaporate. Performance and UX both suffer silently.
**Fix plan:** Move client creation into a `useState(() => new QueryClient(...))` initializer (or a module-level singleton inside `"use client"`). Configure sensible defaults (`staleTime`, retry policy) while you're there.

---

## ADMIN-011 — Host edit pages silently fail "Please sign in again" on hard reload

- **Severity:** medium
- **Category:** race-condition
- **Verdict:** real
- **Confidence:** high
- **Files:**
  - `apps/admin/src/app/(dashboard)/host/spaces/[id]/edit/page.tsx` lines 27–59
  - `apps/admin/src/app/(dashboard)/host/venues/[id]/edit/page.tsx` lines 27–59
- **Symbol:** `HostEditSpacePage.fetchSpace`, `HostEditVenuePage.fetchVenue`

**Root cause:** On first render the Zustand store has `token === null` (`initialize()` runs only after `AuthProvider`'s `useEffect`). The fetch callback short-circuits with `setLoadError("Please sign in again.")` and `setIsLoading(false)`. The `useEffect` dep list does include `token`, so a second pass after init *does* re-run and succeed, but the user sees a destructive "Please sign in again" red error box flash in between, and `isLoading` is already false so the skeleton disappears.
**Impact:** Confusing flash on every hard reload of a host edit page; even more confusing if the user is genuinely signed in. Inconsistent with the admin edit page (`/admin/spaces/[id]/edit`) which correctly calls `getToken()` and redirects to `/login` only if no session exists.
**Fix plan:** Either also call `getToken()` in the host edit pages (matching the admin sibling), or wait for `useAuthStore.isLoading === false` before attempting fetch, or render a skeleton until token is populated. Pick one consistent pattern and apply to both edit pages.

---

## ADMIN-012 — `NewSpacePage` / `NewVenuePage` send `Bearer null` when token isn't ready

- **Severity:** medium
- **Category:** race-condition
- **Verdict:** real
- **Confidence:** high
- **Files:**
  - `apps/admin/src/app/(dashboard)/host/spaces/new/page.tsx` lines 19–35
  - `apps/admin/src/app/(dashboard)/host/venues/new/page.tsx` lines 16–32
- **Symbol:** `NewSpacePage.handleCreate`, `NewVenuePage.handleCreate`

**Root cause:** `handleCreate` reads `token` from the Zustand selector at submit time. If the user opens a new tab directly on `/host/spaces/new`, fills the form and clicks Submit before AuthProvider has finished initialising (unlikely but possible) — or if the token has been cleared and the user submits anyway — the fetch sends `Authorization: Bearer null` and the backend rejects with 401. The error surfaced ("Failed to create space") is generic. No call to `getToken()` to refresh.
**Impact:** Submitted form data appears to fail validation/server error when the actual issue is auth. Hosts cannot tell why their submission was rejected.
**Fix plan:** Use the same `getToken()` pattern that the admin edit page uses, and redirect to `/login` when null. Better: pass a memoised `submit` callback that resolves the token inside.

---

## ADMIN-013 — `HostVenuesPage` swallows non-401 failures and renders empty state

- **Severity:** medium
- **Category:** error-handling
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/admin/src/app/(dashboard)/host/venues/page.tsx` lines 44–103
- **Symbol:** `HostVenuesPage.fetchVenues`, `HostVenuesPage.deleteVenue`

**Root cause:** `fetchVenues` only handles `res.ok` and `res.status === 401`. Any 4xx (other than 401) or 5xx response leaves `venues` as `[]`, hides loading, and renders the "You haven't created any venues yet" CTA — making the host think they have to start over. `deleteVenue` is similarly silent on non-OK/non-401 responses.
**Impact:** Host opens `/host/venues`, product-service is down or returns 500 → they see "Add Your First Venue" and click it, potentially creating a duplicate. After deleting, if the server rejects the request, the venue still shows in the list with no indication of failure (because `deleteVenue` doesn't update on failure). Inconsistent with the sibling `host/spaces/page.tsx` which surfaces a retryable error.
**Fix plan:** Mirror the `HostSpacesPage` pattern with a top-level `error` state and `DataLoadError` component. Surface delete failures via toast or inline error.

---

## ADMIN-014 — Exchange-rates input rejects partial numeric input mid-typing

- **Severity:** medium
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/admin/src/app/(dashboard)/admin/exchange-rates/page.tsx` lines 52–57, 159–168
- **Symbol:** `ExchangeRatesPage.handleRateChange`

**Root cause:** `handleRateChange` only writes to `editedRates` when `!isNaN(numValue) && numValue > 0`. Combined with `value={editedRates[rate.id] ?? rate.rate}` on a controlled input, several common keystrokes are rejected:
- Typing "0" → not stored → input snaps back to original rate.
- Typing "1." (mid-decimal) → `parseFloat("1.") === 1` is stored, the trailing `.` is lost from display, so the user cannot type "1.5".
- Clearing the field to retype → empty string parses to NaN → not stored → snaps to original.
- Negative rates can't be entered (probably intended), but the UX is the same as the empty-string failure mode and indistinguishable.

Also, `hasChanges = Object.keys(editedRates).length > 0` stays true even after the admin reverts an edit back to the original value, so the "Save All" button is enabled and saves no-op rows.
**Impact:** Admins effectively cannot enter decimal exchange rates (e.g. `0.92`) without fighting the input. Save button gives false impression of unsaved changes.
**Fix plan:** Store the *string* value in `editedRates` and only `parseFloat` at save time. Validate at save (and warn on save) rather than at keystroke. Treat "edited value equals original" as not-dirty.

---

## ADMIN-015 — Admin "All Bookings" `useEffect` calls `fetchBookings` indirectly through unstable `getToken` reference

- **Severity:** medium
- **Category:** race-condition
- **Verdict:** real
- **Confidence:** medium
- **File:** `apps/admin/src/app/(dashboard)/admin/bookings/page.tsx` lines 17–59
- **Symbol:** `BookingsPage.fetchBookings`

**Root cause:** `fetchBookings` is a `useCallback` whose deps include `getToken` from the Zustand store. Because the store returns a fresh function reference on each Zustand state change, `fetchBookings` is re-created on every store update (login, logout, token rotation, even sidebar state changes if components mutate other store fields elsewhere). The dependent `useEffect` then re-runs and re-fires the network request. Combined with ADMIN-001 (every `getToken()` triggers a refresh), this can produce a feedback loop where each refresh-induced token write triggers another refresh.
**Impact:** Excessive refetches, refresh-token rotation churn, and possible logout races (see ADMIN-001). Same pattern appears in `admin/users/page.tsx`, `admin/users/[id]/page.tsx`, host pages — anywhere `getToken` is in a `useCallback` dep.
**Fix plan:** Use a stable selector or pull `getToken` via `useAuthStore.getState().getToken` inside the callback (without subscribing), or memoise getToken in the store with `useShallow`. The deeper fix is ADMIN-001: stop rotating tokens on every call.

---

## ADMIN-016 — `mapSpaceToFormValues` passes through `null/undefined` for `categorySlug` and `cancellationPolicy`

- **Severity:** medium
- **Category:** data-integrity
- **Verdict:** real
- **Confidence:** medium
- **File:** `apps/admin/src/components/spaces/space-form.shared.ts` lines 233–260
- **Symbol:** `mapSpaceToFormValues`

**Root cause:** `categorySlug: space.categorySlug` and `cancellationPolicy: space.cancellationPolicy` are forwarded directly. If the backend returns `null` (the Prisma Space type permits null in older rows), the resulting form state holds `null`, the `<select required>` cannot match it, and the user is forced to re-pick a category before save. More dangerously, `buildSpacePayload` sends `categorySlug: null` straight back to the PUT endpoint if the user doesn't notice, which the backend may store as-is, blanking the category on existing rows.
**Impact:** Edit-and-resave of an older space without a category silently drops other unrelated edits' category metadata, and breaks the `normalizeCategorySlug` re-sync in `SpaceForm.useEffect`.
**Fix plan:** Coalesce: `categorySlug: space.categorySlug ?? ""` and `cancellationPolicy: space.cancellationPolicy ?? "MODERATE"`. Add a runtime check in `buildSpacePayload` that throws when `categorySlug` is empty so admins can't accidentally submit a blank category.

---

## ADMIN-017 — `lazy require("@/lib/auth")` in Zustand store breaks under ESM/turbopack

- **Severity:** medium
- **Category:** other
- **Verdict:** unclear
- **Confidence:** medium
- **File:** `apps/admin/src/stores/authStore.ts` lines 5–23
- **Symbol:** `getAuthFunctions`

**Root cause:** `getAuthFunctions` uses CommonJS `require("@/lib/auth")` inside a `"type": "module"` package (per `apps/admin/package.json`) compiled by Next.js + Turbopack. The intent is to avoid SSR `localStorage` access. Turbopack/Next 15.3 transforms `require()` calls but the pattern is fragile and downgrades type safety (the eslint disable proves it). If Turbopack ever stops polyfilling CJS interop, the store crashes on first client invocation.
**Impact:** Latent runtime hazard. Today it likely works (the project tests pass) but the abstraction is unnecessary — the SSR guard can be done by checking `typeof window === "undefined"` before each call (which the auth functions themselves already do). The `require()` also defeats tree-shaking of the auth module.
**Fix plan:** Replace `getAuthFunctions` with a top-level `import * as auth from "@/lib/auth"` and rely on the `typeof window === "undefined"` checks already present inside `lib/auth.ts`. Drop the manual SSR stubs.

---

## ADMIN-018 — Login redirect race: `router.push("/")` runs before store sees new auth state

- **Severity:** low
- **Category:** race-condition
- **Verdict:** real
- **Confidence:** medium
- **File:** `apps/admin/src/app/(auth)/login/page.tsx` lines 19–32
- **Symbol:** `AdminLoginPage.handleSubmit`

**Root cause:** Login calls `await login(email,password)` (which `set(...)` updates the Zustand store synchronously) and then `router.push("/")`. The (dashboard)/page.tsx `Homepage` then reads `useAuthStore()` and decides where to redirect. With React 18/19's transition behaviour and Zustand's synchronous set, this generally works, but the homepage also includes `isLoading` in its decision and `Homepage` mounts before `AuthProvider`'s effect runs in a fresh navigation, which can cause it to bail out before the second pass.
**Impact:** Occasional flicker through `/` and bounce to `/login` then back to `/host` or `/admin`. Not data-destructive but a poor login UX.
**Fix plan:** Make `login` return the resolved user so the login page can call `router.replace(user.role === "ADMIN" ? "/admin" : "/host")` directly, skipping the intermediate redirect dance.

---

## ADMIN-019 — `HostBookingsPage` filter state lives only in component, URL is read once and never written

- **Severity:** low
- **Category:** logic-inconsistency
- **Verdict:** real
- **Confidence:** high
- **File:** `apps/admin/src/app/(dashboard)/host/bookings/page.tsx` lines 73–74, 377–419
- **Symbol:** `HostBookingsPage` filter UI

**Root cause:** Initial filter and spaceFilter are read from `useSearchParams()` once, but neither `setFilter` nor `setSpaceFilter` writes back to the URL. The host dashboard's "Needs attention" CTA at `/host?...` deep-links to `/host/bookings?status=pending`, which loads correctly the first time, but if the user clicks another filter then refreshes, they're back to pending — confusing. Also, the "Needs attention" link target `?status=pending` (lowercase) does not match the filter values (`PENDING` uppercase): the initial state becomes `filter="pending"` and no rows are filtered (the comparison `booking.status === "pending"` is always false), so the page silently shows *all* bookings instead of pending ones.
**Impact:** The "pending bookings need your attention" CTA does not actually filter to pending bookings — case mismatch makes the deep link a no-op filter.
**Fix plan:** Normalise the URL param to upper case (or both sides to lower case), and `router.replace` the URL whenever filters change. Add a test for the deep-link round-trip.

---

## ADMIN-020 — `categories` page DELETE on category sends to product-service without retry/refresh

- **Severity:** low
- **Category:** error-handling
- **Verdict:** real
- **Confidence:** medium
- **File:** `apps/admin/src/app/(dashboard)/admin/categories/page.tsx` lines 54–78
- **Symbol:** `CategoriesPage.deleteCategory`

**Root cause:** `deleteCategory` reads `token` from the store (not `getToken`), so it ignores token refresh — if the access token has expired mid-session, the DELETE 401s and the user sees a generic "Failed to delete category" toast. Same for the amenities page.
**Impact:** Surprising 401s during long admin sessions. Inconsistent with `AddCategory` which uses `getToken()`. Same root cause is the larger ADMIN-001 issue; this finding flags the inconsistency.
**Fix plan:** Use `getToken()` (or the cookie-based flow proposed in ADMIN-004) consistently across mutations.

---

## ADMIN-021 — `host/bookings` mutations don't lock out parallel actions across rows

- **Severity:** low
- **Category:** race-condition
- **Verdict:** real
- **Confidence:** medium
- **File:** `apps/admin/src/app/(dashboard)/host/bookings/page.tsx` lines 121–236
- **Symbol:** `HostBookingsPage.handleApprove/handleReject/handleComplete`

**Root cause:** `actionLoading` is a single `string | null`. If a host clicks Approve on booking A then Approve on booking B before A's network call returns, A's button re-enables when B's setter overwrites the state, and the local optimistic update for A may end up in a stale closure (the second click reads `bookings` after A's mutation but only A's response can update its own row's state). The simple `setBookings((prev) => prev.map(...))` is safe under React 18, but the per-row loading indicator misleads — both buttons end up showing spinners then suddenly both clear when the second one finishes.
**Impact:** UI lies about which booking is in flight; rapid double-clicks could trigger double approval if backend isn't idempotent.
**Fix plan:** Use a `Set<string>` for in-flight booking IDs, and disable each row's buttons based on membership.

---

## ADMIN-022 — Stale-data toast: `addAmenity` appends server response without refetch, but `deleteAmenity` doesn't await refresh either

- **Severity:** low
- **Category:** data-integrity
- **Verdict:** real
- **Confidence:** medium
- **File:** `apps/admin/src/app/(dashboard)/admin/amenities/page.tsx` lines 51–107
- **Symbol:** `AmenitiesPage.addAmenity`, `deleteAmenity`

**Root cause:** The list is loaded once on mount (`useEffect(() => fetchAmenities(), [])` — note empty deps and missing fetchAmenities in deps list). On add, the new item is prepended optimistically using the server response. On delete, the local state filters out the id. If a sibling admin (or the same admin in another tab) creates a category in between, the local list silently drifts from the server. There's no manual refresh control and no React Query subscription. Same pattern in categories page (which does call `fetchCategories` after add but not after delete — line 64-69 just updates local state on delete).
**Impact:** Admins working in parallel see divergent lists. Low-severity because admin volume is low and the backend is the source of truth, but the absence of a "Refresh" button or polling means drift accumulates.
**Fix plan:** Use React Query (`useQuery`/`useMutation` with cache invalidation) consistently for these admin tables — the QueryClient is already mounted (though buggy, see ADMIN-010).

---

## Remaining areas

The 25-finding budget was not exceeded, but the following areas were spot-checked rather than exhaustively reviewed and may merit a follow-up pass:

- **Test files** (`*.test.tsx`) were not read in depth; they may reveal additional expected behaviour the implementation violates.
- **`AppSidebar` / `Navbar` deep-link role visibility** — the sidebar shows "Administration" only when `isAdmin` is true based on local state, but this also runs in pre-init / SSR phase where `isAdmin` is `false` (default), causing a layout flash.
- **`(dashboard)/layout.tsx` is a server component reading `cookies()`** — does not gate auth at all; pairs with ADMIN-003.
- **Image `next.config.ts` remote pattern logic** — the port-stripping branch may break for non-standard product-service ports; minor.
- **Order-service / product-service shape contracts** — I sampled routes but did not verify each admin fetch's response JSON shape against the controller. Mismatches between `images: string[]` (admin types) vs the legacy stringified-JSON pattern (only the admin spaces table parses both) may exist elsewhere.
- **`SpaceForm` `useEffect` on `[categories, formData.categorySlug]`** is suspicious — `categories` is `useMemo`'d off `categoryGroups`, but the effect mutates `formData.categorySlug` via `normalizeCategorySlug`, which could feedback-loop if `categories` ever changes identity per render.
- **`AddCategory.tsx`** — `getToken` is not awaited in error cases; if `getToken` returns null (logged out), the request sends `Bearer null`. Same as ADMIN-012 pattern.
- **Translation tabs** — the `disabled` English input still shows the value but never lets the user re-sync the main field with translations; possible UX confusion but not a bug.
