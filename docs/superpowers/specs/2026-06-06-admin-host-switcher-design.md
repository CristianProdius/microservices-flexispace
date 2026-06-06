# Admin Host Switcher — Design

## Goal

Let an admin "act as" any host from inside the admin app, so they can
manage that host's venues, spaces, bookings, and earnings from the same
host workspace the host themselves uses. Adds a sidebar host-picker
plus a server-side impersonation mechanic.

Also lets the admin create new lead host accounts directly from the
dashboard, so the lead pipeline (currently seeded as `local_*` rows)
can be expanded without touching the database.

Hosts themselves see no change.

## Motivation

In production today, every venue is owned by a seeded lead host
account (`local_ihub_chisinau`, `local_courtyard_chisinau`, etc.). The
existing `My Venues / My Spaces / My Bookings / Earnings` pages filter
strictly by `hostId === currentUser.id`, so an admin signing in sees
zero of their own data and has no way to manage the leads' content
short of editing the database. The new switcher closes that gap and
gives the admin a single, consistent way to operate on any host's
workspace.

## Scope

In scope (v1):

1. Sidebar `HostSwitcher` dropdown, visible only when
   `role === 'ADMIN'`.
2. Impersonation header `X-Acting-Host-Id` + server middleware
   `resolveActingHost` that swaps `req.userId` to the target host on
   admin requests.
3. Empty-state CTA on all four host pages when no host is selected.
4. Two new admin-only endpoints: `GET /users/hosts` (auth-service) and
   `POST /users/hosts/lead` (auth-service).
5. One new admin-only endpoint: `GET /venues/counts-by-host`
   (product-service), used by the dropdown to render venue counts.
6. Structured server log entries for mutating requests when an admin
   is acting as a different host.

Out of scope (explicit, deferred):

- Invite-email flow that lets a converted lead claim their account.
- Bulk lead import.
- Ownership transfer (reassigning a venue from host A to host B).
- DB-level audit columns (we use logs only in v1).
- Applying the switcher to `apps/client` — admin-app only.
- Removing `/admin/spaces` and `/admin/bookings` — those remain as
  cross-host aggregated data-table views, distinct from the
  per-host workspace.

## UX

### Sidebar — when admin is logged in

```
Host View
┌────────────────────────────────────┐
│ Acting as:  Select a host…    ▾   │
└────────────────────────────────────┘
   Dashboard
   My Venues
   My Spaces
   My Bookings
   Earnings
   Add New Space

Administration
   Platform Dashboard
   Users
   All Spaces
   All Bookings
   Categories
   …
```

The switcher renders only when `useAuthStore().isAdmin === true`.
Hosts and regular users never see it.

### Dropdown contents

1. Search input at the top (filters list by case-insensitive substring
   match on `name`, `username`, or `email`).
2. List of hosts. Each row: avatar + `name` (or username if name is
   null) + email + a small role/status badge:
   - `LEAD` — `emailVerified === false`
   - `HOST` — `role === 'HOST'` and `emailVerified === true`
   - `ADMIN` — `role === 'ADMIN'` (the current user)
   - `+ verified` chip when `hostVerified === true`
3. Each row also shows the venue count to the right (e.g. `3 venues`).
4. Divider, then a `+ Create new lead host` action which opens a
   modal (see "Create lead host" below).

### Selecting a host

- Updates `actingHostId` in the admin auth store and `localStorage`.
- The four host pages already use client-side `useEffect`-driven
  fetches; each page subscribes to `actingHostId` via
  `useActingHostId()` and adds it to the fetch `useCallback`/
  `useEffect` dependency array, so changing the selection refetches
  the page automatically. No router reload required.
- Sidebar label switches to `Acting as: <name>` with a small `Clear`
  affordance next to the label that resets the selection.

### Empty state (no host selected)

Each host page (`/host/venues`, `/host/spaces`, `/host/bookings`,
`/host/earnings`) detects `isAdmin && !actingHostId` and renders a
banner instead of the normal page body:

> **You're connected as an admin.**
> Pick a host from the sidebar to view their workspace, or visit the
> [Platform Dashboard](/admin/dashboard).

The banner replaces the page's normal content but the sidebar stays
visible.

### Create lead host (modal)

Triggered from the switcher dropdown. Form fields:

- `name` (required)
- `username` (required, must be unique — server validates)
- `email` (optional; defaults to `hosts+<slug-of-username>@spacefly.ai`)
- `bio` (optional)
- `hostingSince` (optional date)

Submitting calls `POST /users/hosts/lead`. On success the modal closes,
the dropdown refreshes, and the new host is auto-selected (admin is
now acting as them).

## Architecture

### Client — `apps/admin`

**Auth store extension** (`src/stores/authStore.ts`):

- New state: `actingHostId: string | null`, hydrated from
  `localStorage['spacefly_acting_host']` on load.
- New action: `setActingHost(id: string | null)`. Writes to both
  in-memory state and `localStorage`.
- Exported selector hook: `useActingHostId()`.

**Fetch wrapper** (`src/lib/apiFetch.ts`, new):

```ts
export async function apiFetch(input: string, init: RequestInit = {}) {
  const { getToken, actingHostId, isAdmin } = useAuthStore.getState();
  const token = await getToken();
  if (!token) throw new UnauthenticatedError();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (isAdmin && actingHostId) {
    headers.set('X-Acting-Host-Id', actingHostId);
  }
  return fetch(input, { ...init, headers });
}
```

Plus a 401 handler that calls `router.push('/login')` on the caller's
behalf — the calling page passes a router instance, or `apiFetch`
throws a typed `UnauthenticatedError` that pages catch.

**Refactor**: every direct `fetch(${NEXT_PUBLIC_*_SERVICE_URL}…)` call
under `apps/admin/src/app/(dashboard)/host/**` migrates to `apiFetch`.
The existing `apps/admin/src/app/(dashboard)/admin/**` pages also
migrate, even though they don't need the acting-host header — the
goal is one consistent fetch primitive in the admin app.

`apps/client` is untouched (admin-only feature).

**Component** (`src/components/HostSwitcher.tsx`, new):

- Fetches `GET /users/hosts` + `GET /venues/counts-by-host` in parallel.
- Merges counts onto the host list client-side.
- Renders search + list + create-lead trigger.
- Composes the `+ Create new lead host` modal inline.
- Imported once by `AppSidebar.tsx`, conditionally rendered.

### Server — `packages/auth-middleware`

**New middleware** `resolveActingHost`, exported in all three runtime
flavors (`express.ts`, `fastify.ts`, `hono.ts`) for symmetry with the
existing `shouldBeHost*` family. The function:

1. Reads `X-Acting-Host-Id` from the request headers.
2. If header is missing → returns `next()` (no-op).
3. If `req.user.role !== 'ADMIN'` → returns `next()` (silently
   ignore; only admins can impersonate). This means a host who sends
   the header by mistake or maliciously is just treated as themselves.
4. Looks up the target user in the DB (single `prisma.user.findUnique`
   selecting only `id`, `role`, `hostVerified`).
5. If not found, or role is not `HOST`/`ADMIN`, responds `400` with
   `{ message: 'Invalid acting host' }`.
6. On success: mutates `req.userId` to the target's id; attaches
   `req.actingHostId = targetId` and `req.realUserId = originalId`
   for downstream loggers; calls `next()`.

Order of middleware on each host route:

```
shouldBeHost (or shouldBeHostOrAdmin)
  → resolveActingHost
  → controller
```

`shouldBeHost` runs first because it both authenticates the JWT and
verifies the requester has host-or-admin access. Only after that does
`resolveActingHost` consider rewriting `req.userId`.

**Logging**:

In `resolveActingHost`, when impersonation activates AND the method is
not safe (i.e., one of `POST`, `PUT`, `PATCH`, `DELETE`), emit a
structured log line:

```
{
  level: 'info',
  msg: 'admin acting as host',
  realUserId: req.realUserId,
  actingHostId: req.actingHostId,
  method: req.method,
  path: req.path,
}
```

Read-only requests (`GET`, `HEAD`) skip the log to keep volume sane.

### Routes wired into the middleware

`apps/product-service/src/routes/venue.route.ts`:

```ts
router.get('/host/my', shouldBeHost, resolveActingHost, getMyVenues);
router.post('/', shouldBeHost, resolveActingHost, createVenue);
router.put('/:id', shouldBeHostOrAdmin, resolveActingHost, updateVenue);
router.delete('/:id', shouldBeHostOrAdmin, resolveActingHost, deleteVenue);
```

`apps/product-service/src/routes/space.route.ts`:
Same treatment for the host-scoped routes (`/host/my`, `POST /`,
`PUT /:id`, `DELETE /:id`).

`apps/order-service/src/routes/booking.ts`:
Same for host-scoped read/write endpoints.

`apps/order-service/src/routes/payout.route.ts` (earnings):
Same.

The exact route names are inventoried in the implementation plan
(`docs/superpowers/plans/...`) before any code change, to avoid
missing one.

### New endpoints

**`GET /users/hosts`** — `apps/auth-service`

- Middleware: `shouldBeAdmin`.
- Returns: `Array<{ id, name, username, email, image, role,
  hostVerified, emailVerified, hostingSince }>`.
- Source: `prisma.user.findMany({ where: { role: { in: ['HOST', 'ADMIN'] } }, orderBy: { name: 'asc' } })`.
- No pagination in v1 (current host count is < 20).

**`POST /users/hosts/lead`** — `apps/auth-service`

- Middleware: `shouldBeAdmin`.
- Validates body with zod:
  - `name`: required, 1–80 chars.
  - `username`: required, 3–32 chars, regex `^[a-z0-9_-]+$`.
  - `email`: optional, valid email.
  - `bio`: optional, max 500 chars.
  - `hostingSince`: optional ISO date.
- Defaults `email` to `hosts+<username>@spacefly.ai` when omitted.
- Generates a random 64-byte password and stores its bcrypt hash —
  the lead cannot log in until invited.
- Inserts the user with `role: 'HOST'`, `hostVerified: true`,
  `emailVerified: false`.
- Conflict handling: 409 on duplicate `username` or `email`.
- Returns the new user record (without password hash).

**`GET /venues/counts-by-host`** — `apps/product-service`

- Middleware: `shouldBeAdmin`.
- Returns: `Array<{ hostId: string, count: number }>`.
- Source: `prisma.venue.groupBy({ by: ['hostId'], _count: { _all: true } })`.

## Permissions matrix

| Caller | Header | Behavior |
| --- | --- | --- |
| ADMIN, no `X-Acting-Host-Id` | — | Uses admin's own id (today's behavior; pages show empty data). |
| ADMIN, valid host id in header | ✓ | `req.userId` becomes the target host's id; controllers behave as if the host themselves called. |
| ADMIN, unknown id in header | ✓ | `400 Invalid acting host`. |
| HOST, any header value | — | Header ignored; `req.userId` is the host's own id. |
| USER, any header value | — | Already blocked by `shouldBeHost`; never reaches `resolveActingHost`. |

The mutation/edit/delete authorization in existing controllers
(`Venue.hostId === req.userId`) continues to gate access — after the
swap, an admin acting as host X passes the check, and an admin
without the header fails it. Behavior matches the role's intent
without controller changes.

## Failure modes

- **Header refers to a deleted user** — `resolveActingHost` 400s.
- **Header refers to a USER (not HOST/ADMIN)** — `resolveActingHost`
  400s.
- **Header refers to the admin themselves** — allowed; effectively a
  no-op (acting as self).
- **Admin clears localStorage in another tab** — store rehydrates on
  next mount; next request omits the header; UI shows empty state.
- **Auth-service unreachable when fetching host list** — switcher
  shows an inline "Couldn't load hosts" message with a retry button.

## Testing

### Unit

- `resolveActingHost`:
  - No header → no-op.
  - Header + non-admin → no-op (header ignored).
  - Header + admin + valid HOST id → `req.userId` mutated, log written
    on mutating method.
  - Header + admin + valid HOST id + GET → mutated, no log.
  - Header + admin + unknown id → 400.
  - Header + admin + USER role id → 400.
- `apiFetch`:
  - Includes `X-Acting-Host-Id` only when `isAdmin && actingHostId`.
  - Omits the header when admin has cleared the selection.
  - Adds `Authorization` from token always.

### Integration

- Admin acts as host with venues → `GET /venues/host/my` returns
  that host's venues (not zero).
- Admin acts as host A then issues `PUT /venues/:id` on a venue owned
  by host B → 403 (ownership check still works).
- Admin acts as host A and `PUT /venues/:id` on a venue owned by host
  A → 200.
- Host calling `GET /venues/host/my` with `X-Acting-Host-Id` set to
  some other host → still receives their own venues (header ignored).
- `POST /users/hosts/lead` by admin → 201 + user persisted with
  default email.
- `POST /users/hosts/lead` by host → 403.
- Duplicate username → 409.

### Manual smoke

- Log in as admin, open `/host/venues` — see empty state.
- Pick a host from the dropdown — venues appear; URL unchanged.
- Edit a venue — succeeds.
- Switch to another host — venue list changes.
- Clear acting host — empty state returns.
- Create a new lead host from the modal — appears in dropdown,
  auto-selected, empty workspace ready to populate.

## Implementation order (not the full plan; just sequencing intent)

1. Server middleware `resolveActingHost` (Express variant only, since
   product-service and order-service are both Express). Unit tests.
2. Wire middleware into host routes; add integration tests.
3. New endpoints `GET /users/hosts`, `POST /users/hosts/lead`,
   `GET /venues/counts-by-host`.
4. Client: `actingHostId` in auth store + `apiFetch` wrapper.
5. Migrate existing admin-app host fetches to `apiFetch`.
6. `HostSwitcher` component + create-lead modal.
7. Empty-state banners on the four host pages.
8. Manual smoke against local + production parity.

The implementation plan written by `writing-plans` after this spec is
approved will expand each step into reviewable units.
