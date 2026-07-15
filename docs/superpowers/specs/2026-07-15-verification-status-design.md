# Verification Status — Design Spec (Feature 1)

**Date:** 2026-07-15
**Status:** Approved (revised)
**Branch:** `feat/verification-status` (off `main`)

## Motivation

The public "Verified" badge on venues/hosts should become a formal status defaulting to
`UNVERIFIED`, with every existing venue/host reset (no badge shown) and `UNVERIFIED` never
rendering a badge. `*Recommended` / `*Sponsored` badges are unchanged.

**Critical constraint (why this is a split, not a rename):** `hostVerified` is
**overloaded** — besides the badge it is the **authorization** flag that lets a HOST
create/manage listings (`packages/auth-middleware/src/authorization.ts` →
`hasVerifiedHostAccess`, the `shouldBeHost` gate, and it is signed into every JWT by the
auth-service and set by the host-onboarding flow). Resetting it would lock every host out.
So we must SEPARATE the display badge from the authorization flag.

## Approach

Add `enum VerificationStatus { UNVERIFIED VERIFIED }`.

- **Venue (display only, safe):** replace `venueVerified` boolean →
  `venueVerificationStatus VerificationStatus @default(UNVERIFIED)`. The migration resets
  everyone to `UNVERIFIED`.
- **Host:** KEEP `hostVerified Boolean` untouched (it stays the authorization flag — the
  auth-service, auth-middleware, JWT, and onboarding flow are NOT changed). ADD a NEW
  `hostVerificationStatus VerificationStatus @default(UNVERIFIED)` used ONLY for the public
  badge. Everyone starts `UNVERIFIED` (no badge), while keeping their host access.
- `*Recommended` / `*Sponsored` stay booleans.

Result: no "Verified" badges show by default; hosts keep access; an admin can grant the
badge later independent of authorization.

## Changes by layer

### Schema + migration (`packages/db`)
- `enum VerificationStatus { UNVERIFIED VERIFIED }`.
- `Venue`: `venueVerified Boolean` → `venueVerificationStatus VerificationStatus @default(UNVERIFIED)`.
- `User`: KEEP `hostVerified Boolean @default(false)`; ADD `hostVerificationStatus VerificationStatus @default(UNVERIFIED)`.
- Featured-sort composite indexes tier by the DISPLAY status: change
  `@@index([venueSponsored, venueRecommended, venueVerified])` →
  `... venueVerificationStatus]`, and `@@index([hostSponsored, hostRecommended, hostVerified])`
  → `... hostVerificationStatus]`.
- Hand-authored migration SQL (no local DB → `prisma validate` + `db:generate`, mirror the
  newest migration): create the enum; `Venue` ADD `venueVerificationStatus DEFAULT 'UNVERIFIED'`,
  drop the old venue index, create the new one, DROP COLUMN `venueVerified`; `User` ADD
  `hostVerificationStatus DEFAULT 'UNVERIFIED'`, drop the old host index, create the new one
  (KEEP `hostVerified`). No carry-over of old `true` values → the reset.
- `seed.ts`: the demo host `hostVerified: true` MAY stay (it's the auth flag for the demo
  host); do NOT set `hostVerificationStatus` (leave the demo unverified for the badge), OR
  set it explicitly if a demo badge is wanted. Do not touch `hostVerified` semantics.

### Shared types
- `packages/types/src/venue.ts` (DISPLAY types): `venueVerified` → `venueVerificationStatus`;
  the host BADGE fields on `VenueHostSummary` / `HostSummary` (`hostVerified`) →
  `hostVerificationStatus`; `HostVenueCard.venueVerified` → `venueVerificationStatus`. Export
  `VerificationStatus = "UNVERIFIED" | "VERIFIED"`.
- `packages/types/src/auth.ts`: **UNCHANGED** — `User.hostVerified` and
  `JwtPayload.hostVerified` stay (authorization). (Optionally the admin-facing host type may
  also carry `hostVerificationStatus` for the badge toggle, but the JWT/auth types keep
  `hostVerified`.)

### product-service (badge = the new status; auth `hostVerified` untouched)
- `venue.controller.ts`: `verifiedOnly` → `OR[{venueVerificationStatus:"VERIFIED"},
  {host:{hostVerificationStatus:"VERIFIED"}}]`; featured-sort `orderBy` tiers use the status
  columns `desc`; `select` + response mapping expose `venueVerificationStatus` /
  `host.hostVerificationStatus`; `updateVenue` maps its verified input → `venueVerificationStatus`.
- `host.controller.ts`: `getHosts` sort → `hostVerificationStatus`; `HostRow` + mapping expose
  `hostVerificationStatus`; `updateHostListingBadges` sets `hostVerificationStatus` (the badge),
  NOT `hostVerified`. `verifiedOnly` (if present) filters by `hostVerificationStatus`.
- `space.controller.ts`: `venueInclude` select `venueVerified` → `venueVerificationStatus`;
  `getSpaces` featured-sort tiering → status columns.

### Admin
- `venue-form.tsx`: the `venueVerified` checkbox → verify toggle mapped to `venueVerificationStatus`.
- `HostListingBadgesCard.tsx`: the `hostVerified` checkbox now controls the BADGE
  (`hostVerificationStatus`) — the PUT `/hosts/{id}/listing-badges` sends the status; it no
  longer touches host authorization.

### Client display
"Verified" badge condition (`venueVerified || hostVerified`) →
`venueVerificationStatus === "VERIFIED" || hostVerificationStatus === "VERIFIED"` in
`VenueCard.tsx`, `HostCard.tsx`, `VenueSpaceCard.tsx`, `venues/[id]/page.tsx`,
`hosts/[id]/page.tsx`. `UNVERIFIED` = no badge.

## Testing (TDD)
- product-service: `verifiedOnly` filters by the status; featured sort ranks `VERIFIED`
  first; badge-update endpoints set the STATUS (and do NOT change `hostVerified`).
- admin: verify toggle emits the status.
- client: "Verified" badge renders only for `VERIFIED`, hidden for `UNVERIFIED`.
- `prisma validate` + `db:generate`; each touched package: suite + typecheck + lint.

## Out of scope / untouched
- `hostVerified` authorization (auth-service, auth-middleware, JWT, onboarding) — NOT changed.
- `*Recommended` / `*Sponsored` booleans.
- Flexible coworking pricing (Feature 2) — after PRs #28 + #29 merge.
