# Hosts Browse Filter — Design

## Goal

Add a filter row above the `/hosts` grid that lets visitors narrow the
host directory by attributes that exist at the host level. Spaces-level
filters (capacity, price, instant-book, category) are intentionally
excluded because they don't apply to a host as a whole.

## User-visible scope

A single inline row above the host grid containing four controls:

1. **Search** — debounced text input for host name or username.
2. **City** — dropdown sourced from the API (only cities with active
   hosted venues).
3. **Verified only** — toggle pill.
4. **Sort** — dropdown: Featured (default), Most venues, Newest.

Mobile: the row wraps; no drawer (only four controls, low value).

All state lives in the URL via query string; the page is shareable and
back/forward navigation works.

## Backend — `apps/product-service/src/controllers/host.controller.ts`

`getHosts` extends its query handling:

- `city?: string` — already supported, unchanged.
- `verified?: "true"` — when present, adds `hostVerified: true` to the
  user where-clause.
- `search?: string` — when non-empty, adds
  `OR: [{ name: { contains, mode: insensitive } }, { username: { contains, mode: insensitive } }]`.
- `sort?: "featured" | "mostVenues" | "newest"` — default `featured`.
  Maps to Prisma `orderBy`:
  - `featured` → `[{ hostVerified: "desc" }, { hostingSince: "asc" }]`
    (unchanged from today).
  - `mostVenues` → `{ venues: { _count: "desc" } }`. (The relation
    `_count` already respects the venue `where` clause we pass, so this
    counts active venues only.)
  - `newest` → `{ hostingSince: "desc" }`.

`mostSpaces` is out of scope. Prisma can't `orderBy` on a transitive
`_count` (User → Venue → Space) without raw SQL or a denormalized
counter; not worth the complexity for v1.

**Response shape** gains one field:

```ts
interface HostsResponse {
  hosts: HostSummary[];
  pagination: { ... };
  availableCities: string[]; // sorted, distinct
}
```

`availableCities` is computed from `prisma.venue.findMany({ where: { isActive: true }, distinct: ["city"], select: { city: true }})`,
then sorted alphabetically. It is **not** affected by the current
`?city=` filter so the dropdown stays populated after a selection. This
adds one extra DB query; acceptable given the page caches for 60s
(`next: { revalidate: 60 }`).

## Frontend

### New component `apps/client/src/components/HostFilter.tsx`

`"use client"`. Props:

```ts
interface HostFilterProps {
  availableCities: string[];
}
```

State is read from `useSearchParams()`; changes are written via
`router.replace(pathname + "?" + params)` so navigation is shallow. The
search input is debounced ~300ms before pushing to the URL. Pattern
mirrors `SpaceFilter` but with a flat control row (no drawer, no
`Drawer`/`Popover` from `@base-ui/react`).

### Updated page `apps/client/src/app/[locale]/(main)/hosts/page.tsx`

- Accepts `searchParams: Promise<{ city?, verified?, search?, sort? }>`.
- Awaits params, forwards them as query string to
  `${PRODUCT_SERVICE_URL}/hosts?...`.
- Renders `<HostFilter availableCities={data.availableCities} />` above
  the existing grid.
- Existing error / empty / list rendering is unchanged.

## i18n

Extend the `hosts` namespace in `apps/client/messages/{en,ro,ru}.json`:

```jsonc
"hosts": {
  "filters": {
    "searchPlaceholder": "Search hosts",
    "allCities": "All cities",
    "verifiedOnly": "Verified only",
    "sort": {
      "label": "Sort by",
      "featured": "Featured",
      "mostVenues": "Most venues",
      "newest": "Newest"
    },
    "clear": "Clear filters"
  }
}
```

Romanian and Russian translations will be added in the same change
(same keys, translated values) — matching the existing pattern where
all three locale files are kept in sync per commit.

## Tests

Extend `apps/product-service/src/controllers/host.controller.test.ts`:

- `?verified=true` adds `hostVerified: true` to the user `where`.
- `?search=foo` adds the case-insensitive `OR` on name / username.
- `?sort=mostVenues` maps to `orderBy: { venues: { _count: "desc" } }`.
- `?sort=newest` maps to `orderBy: { hostingSince: "desc" }`.
- Response contains `availableCities` and it is unaffected by `?city=`.

Existing tests stay green because the defaults are unchanged.

## Out of scope

- Pagination UI for `/hosts` (today the page renders only the first 24).
- "Most spaces" sort.
- Multi-city select / country filter.
- Server-side localization of city names.

## Migration / rollout

Pure additive: new query params are optional, new response field is
additive, existing client code (and the host detail page) is
unaffected. No DB migration. Deploy = rebuild `product-service` and
`client` containers.
