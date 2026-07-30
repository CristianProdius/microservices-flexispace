# Flexible coworking pricing + venue Verified fix + zero-price request — design

Date: 2026-07-30
Branch: `feat/flexible-pricing-and-venue-verified`

From production feedback (Florin, Tekwill) on three items.

## Bug 1 — Venue "Verified" badge never persists

**Root cause.** The admin venue form (`venue-form.shared.ts` `buildVenuePayload`) sends
`venueVerificationStatus` (enum string), but `product-service` `updateVenue` only
destructures a legacy `venueVerified` boolean from the body and maps that to the status.
The `venueVerificationStatus` field is never read, so the write is silently dropped
(Recommended/Sponsored persist because their field names match). Host badges are fine —
`HostListingBadgesCard` sends `hostVerified` boolean which the user endpoint maps.

**Fix.** In `updateVenue`, also destructure `venueVerificationStatus`. Resolve the status
from `venueVerificationStatus` (enum) when present, else fall back to the legacy
`venueVerified` boolean. Include `venueVerificationStatus !== undefined` in the
`hasVenueListingBadgePatch` gate. TDD in `venue.controller.test.ts`.

## Feature 2 — Flexible pricing (independent hourly / daily / monthly)

Today a space picks ONE `pricingType` (`HOURLY|DAILY|BOTH|MONTHLY`) and the admin form
only shows the matching price input(s), so a MONTHLY space (Tekwill) cannot also offer
hourly/daily. Coworking needs any combination.

**Model — derive offered modes from the filled rate fields; `pricingType` becomes
vestigial (kept for back-compat, no longer gates anything).** A mode is *offered* when
its rate column is non-null (the host entered a value, including 0 — see zero-price
below); monthly is offered when `pricePerMonth` is non-null OR the space has monthly
plans.

- **Admin `space-form`:** show all three price inputs (hourly, daily, monthly base) —
  each optional — plus the monthly-plans editor (already ungated). Remove the
  `pricingType`-based gating of inputs and the required `pricingType` dropdown; derive a
  best-effort `pricingType` on save for legacy/search consumers.
- **product-service validation:** accept any combination of set rates; drop the
  "MONTHLY requires pricePerMonth" style single-type rules (a space is valid when it
  offers at least one mode).
- **Client `getPriceDisplay`:** show every offered option inline (`$5/hr · $30/day ·
  $500/mo`) instead of a single branch.
- **Client `BookingForm`:** one `mode` per offered option, a tab per mode
  (`hourly`/`daily`/`monthly`). Monthly mode keeps the plan selector. Default to the
  first offered mode.
- **order-service:** price the **chosen mode explicitly** (client sends `bookingMode`),
  gating on the mode's rate being present, instead of taking the min across all candidate
  modes. This removes cross-mode undercutting and lets a 0 rate price a request (below).
  `isHourly` is derived from `bookingMode === "hourly"`. PricingTiers still cap the hourly
  mode.
- **Filters (`getSpaces`):** include `pricePerMonth` in the min/max price range.

## Feature 3 — Zero price → booking box + request-to-book at 0

Per owner decision, revert the #29 "hide the box / Contact for pricing" behavior for the
common case: a space with a mode set to 0 shows the booking box and can take a
**request-to-book at 0** (a lead the host approves — non-instant only). Instant-book still
requires a positive price (never auto-confirm a free, slot-blocking booking).

- `hasBookablePrice` → true whenever the space offers any mode (any non-null rate or
  plans). "Contact for pricing" only when nothing is offered at all.
- **order-service:** allow a 0 subtotal for the chosen mode when the space is NOT
  instant-book (creates a PENDING request). Keep failing closed (400) for a 0 subtotal on
  an instant-book space. The H1 protection (no accidental free confirmed booking) is
  preserved by scoping 0 to request-to-book.

## Out of scope
- No new DB columns; `pricingType` column stays (vestigial). No change to how pricing
  tiers work beyond the hourly cap.
- No search re-ranking changes beyond adding monthly to the price range.

## Testing
- venue.controller: verified status persists from the enum field.
- space-form.shared: all rate inputs mapped; pricingType derived on save.
- BookingForm (mjs): tab per offered mode; mode from filled rates; zero-rate mode still
  shows a tab.
- pricing-availability: hasBookablePrice true for any offered mode incl 0.
- order-service: mode-explicit pricing; 0 request-to-book allowed for non-instant, 400 for
  instant; cross-mode undercutting gone.
