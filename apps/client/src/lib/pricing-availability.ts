// Flexible pricing: a space offers each booking mode independently, derived from
// which rate fields the host filled in — the single `pricingType` no longer
// gates anything. A mode is "offered" when its rate is SET (non-null), including
// a 0 rate: a 0 is a request-to-book / "free" listing (the host approves the
// request), NOT "not offered". null/undefined means the mode isn't offered.
// Monthly is offered by a base monthly rate OR at least one named monthly plan.
export type BookablePriceSpace = {
  pricingType?: string;
  pricePerHour?: number | null;
  pricePerDay?: number | null;
  pricePerMonth?: number | null;
  monthlyPlans?: Array<unknown> | null;
};

export interface OfferedModes {
  hourly: boolean;
  daily: boolean;
  monthly: boolean;
}

export function offeredModes(space: BookablePriceSpace): OfferedModes {
  return {
    hourly: space.pricePerHour != null,
    daily: space.pricePerDay != null,
    monthly:
      space.pricePerMonth != null || (space.monthlyPlans?.length ?? 0) > 0,
  };
}

// Whether the space offers any bookable mode. Only a space with NO offered mode
// at all falls back to a "Contact for pricing" panel; a mode priced at 0 still
// shows the booking box so a guest can send a request-to-book.
export function hasBookablePrice(space: BookablePriceSpace): boolean {
  const m = offeredModes(space);
  return m.hourly || m.daily || m.monthly;
}
