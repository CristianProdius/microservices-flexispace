# Verification Status — Design Spec (Feature 1)

**Date:** 2026-07-15
**Status:** Approved
**Branch:** `feat/verification-status` (off `main`)

## Motivation

Verification is currently two boolean columns (`venueVerified`, `hostVerified`, default
`false`); a "Verified" badge renders only when `true`. The product owner wants
verification modeled as a **formal status field defaulting to `UNVERIFIED`**, with every
existing venue/host **reset to unverified** (no "Verified" badge shown anywhere) and
`UNVERIFIED` never rendering a badge. `*Recommended` / `*Sponsored` badges are unchanged.

## Approach

Add `enum VerificationStatus { UNVERIFIED VERIFIED }` (extensible later to
`PENDING`/`REJECTED`). Replace the `venueVerified` / `hostVerified` booleans with
`venueVerificationStatus` / `hostVerificationStatus` (default `UNVERIFIED`). The migration
resets everyone to `UNVERIFIED` (old `true` values are NOT carried over — that is the
requested reset). `*Recommended` / `*Sponsored` stay booleans.

## Changes by layer

### Schema + migration (`packages/db`)
- `enum VerificationStatus { UNVERIFIED VERIFIED }`.
- `User.hostVerified Boolean` → `User.hostVerificationStatus VerificationStatus @default(UNVERIFIED)`.
- `Venue.venueVerified Boolean` → `Venue.venueVerificationStatus VerificationStatus @default(UNVERIFIED)`.
- Update the composite indexes `@@index([hostSponsored, hostRecommended, hostVerified])`
  and `@@index([venueSponsored, venueRecommended, venueVerified])` to the new columns.
- Hand-authored migration SQL (no local Spacefly DB → `prisma validate` + `db:generate`
  only, mirror the newest migration folder): create the enum; add the new columns
  `DEFAULT 'UNVERIFIED'`; drop+recreate the two indexes; drop the old boolean columns.
  Result: everyone `UNVERIFIED`.
- `seed.ts` demo host: drop `hostVerified: true` (or set `VERIFIED` for the demo only).

### Shared types (`packages/types/src/venue.ts`)
Export a `VerificationStatus = "UNVERIFIED" | "VERIFIED"` union; replace the boolean fields
with `venueVerificationStatus` / `hostVerificationStatus` across `Venue`,
`VenueHostSummary`, `HostSummary`, `HostVenueCard`.

### product-service
- `venue.controller.ts`: `verifiedOnly` filter → `OR[{venueVerificationStatus:"VERIFIED"},
  {host:{hostVerificationStatus:"VERIFIED"}}]`; featured-sort `orderBy` uses the status
  columns `desc` (enum order `UNVERIFIED` < `VERIFIED` → `desc` ranks VERIFIED first);
  `select` + response mapping updated; `updateVenue` maps its verified input → status.
- `host.controller.ts`: `getHosts` sort, `HostRow`, mapping; `updateHostListingBadges`
  maps verified → status.
- `space.controller.ts`: `venueInclude` select + `getSpaces` featured-sort tiering →
  status columns.

### Admin
- `venue-form.tsx`: the `venueVerified` checkbox becomes a verify toggle → sends
  `VERIFIED`/`UNVERIFIED`.
- `HostListingBadgesCard.tsx`: same for host; PUT `/hosts/{id}/listing-badges` sends the
  mapped status.

### Client display
"Verified" badge condition (`venueVerified || hostVerified`) →
`venueVerificationStatus === "VERIFIED" || hostVerificationStatus === "VERIFIED"` in
`VenueCard.tsx`, `HostCard.tsx`, `VenueSpaceCard.tsx`, `venues/[id]/page.tsx`,
`hosts/[id]/page.tsx`. `UNVERIFIED` renders no badge (unchanged behavior).

## Testing (TDD)
- product-service: `verifiedOnly` filters by status; featured sort ranks `VERIFIED` first
  (update the existing `sort=featured` orderBy tests); update endpoints set status.
- admin: verify toggle emits the status in the payload.
- client: "Verified" badge renders only for `VERIFIED`, hidden for `UNVERIFIED`.
- `prisma validate` + `db:generate` pass. Each touched package: suite + typecheck + lint.

## Out of scope
`*Recommended` / `*Sponsored` remain booleans. Flexible coworking pricing (Feature 2) is a
separate effort sequenced after PRs #28 + #29 merge.
