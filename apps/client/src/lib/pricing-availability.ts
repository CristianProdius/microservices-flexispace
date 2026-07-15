// Whether a space can be booked online right now — i.e. it has a positive base
// rate for its pricing type. A host may set an hourly/daily rate to 0 to list
// the space as "Contact for pricing" (getPriceDisplay renders that label, and
// the order-service fails closed on a zero-candidate price set). In that case
// the detail page shows a contact panel instead of a booking widget that would
// only error on submit.
export type BookablePriceSpace = {
  pricingType: string;
  pricePerHour?: number | null;
  pricePerDay?: number | null;
};

export function hasBookablePrice(space: BookablePriceSpace): boolean {
  const hour = space.pricePerHour ?? 0;
  const day = space.pricePerDay ?? 0;
  switch (space.pricingType) {
    case "HOURLY":
      return hour > 0;
    case "DAILY":
      return day > 0;
    case "BOTH":
      return hour > 0 || day > 0;
    case "MONTHLY":
      // A MONTHLY space is priced by its monthly rate (or, where supported,
      // named monthly plans); its own validation guarantees a bookable price,
      // so it is never a "contact for pricing" listing here.
      return true;
    default:
      return false;
  }
}
