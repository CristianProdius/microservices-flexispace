// The singleton instance is the only sanctioned way to talk to the database.
// Use `import { prisma } from "@repo/db"`.
export { prisma } from "./client";

// Re-export Prisma's generated types/enums (Role, Prisma namespace, BookingStatus,
// BookingActor, Currency, PricingType, SpaceType, CancellationPolicy, …) so
// services can stay typed without reaching into the generated path directly.
//
// `PrismaClient` itself is intentionally excluded — instantiating extra clients
// fragments the connection pool and is forbidden outside this package
// (the seed script imports from ../generated/prisma directly).
export {
  Prisma,
  Role,
  SpaceType,
  PricingType,
  BookingStatus,
  BookingActor,
  CancellationPolicy,
  PayoutStatus,
  Currency,
} from "../generated/prisma";

export type {
  User,
  Session,
  Invite,
  Venue,
  ExchangeRate,
  Space,
  SpaceCategory,
  SpaceCategoryGroup,
  Amenity,
  SpaceAmenity,
  PricingTier,
  Availability,
  BlockedDate,
  Booking,
  Review,
  Payout,
} from "../generated/prisma";
