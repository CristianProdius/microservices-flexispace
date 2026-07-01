import z from "zod";
import type { Currency, PricingTier } from "./currency";

export type { Currency, ExchangeRate, PricingTier } from "./currency";

export type SpaceType =
  | "OFFICE_DESK"
  | "PRIVATE_OFFICE"
  | "MEETING_ROOM"
  | "EVENT_VENUE"
  | "WEDDING_VENUE"
  | "COWORKING_SPACE";

export type PricingType = "HOURLY" | "DAILY" | "BOTH" | "MONTHLY";

export type CancellationPolicy = "FLEXIBLE" | "MODERATE" | "STRICT" | "NON_REFUNDABLE";

export type SpaceCategoryGroupSlug =
  | "business-office"
  | "events-celebrations"
  | "creative-media"
  | "retail-commercial"
  | "sports-wellness"
  | "industrial-logistics";

export type KnownSpaceCategorySlug =
  | "office-desk"
  | "private-office"
  | "meeting-training-room"
  | "coworking-space"
  | "large-conference-hall"
  | "event-venue"
  | "wedding-venue"
  | "rooftop-venue"
  | "garden-outdoor-space"
  | "private-party-space"
  | "private-function-room"
  | "private-dining-room"
  | "vip-suite-private-lounge"
  | "workshop-maker-space"
  | "photo-video-studio"
  | "podcast-studio"
  | "dark-kitchen-cloud-kitchen"
  | "private-cinema-screening-room"
  | "gaming-esports-lounge"
  | "yoga-dance-studio"
  | "sport-courts-fields"
  | "indoor-fitness"
  | "specialty-sports"
  | "retail-store-shop-front"
  | "pop-up-store"
  | "showroom"
  | "micro-warehouse-storage"
  | "warehouse-storage-unit"
  | "distribution-center"
  | "cold-storage"
  | "big-box-retail"
  | "light-industrial-workshop";

export interface SpaceCategoryGroup {
  id: number;
  name: string;
  slug: SpaceCategoryGroupSlug;
  sortOrder: number;
}

export interface SpaceCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  groupSlug: SpaceCategoryGroupSlug;
  sortOrder: number;
  group?: SpaceCategoryGroup;
}

export interface GroupedSpaceCategory extends SpaceCategory {
  _count?: {
    spaces: number;
  };
}

export interface SpaceCategoryGroupWithCategories extends SpaceCategoryGroup {
  categories: GroupedSpaceCategory[];
}

export interface Amenity {
  id: number;
  name: string;
  icon: string | null;
  category: string | null;
  spaceTypes: SpaceType[];
}

export interface SpaceAmenity {
  id: number;
  spaceId: number;
  amenityId: number;
  amenity: Amenity;
}

export interface Availability {
  id: number;
  spaceId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

export interface BlockedDate {
  id: number;
  spaceId: number;
  date: string;
  reason: string | null;
}

export interface Space {
  id: number;
  name: string;
  shortDescription: string;
  description: string;
  spaceType: SpaceType;
  pricingType: PricingType;
  pricePerHour: number | null;
  pricePerDay: number | null;
  pricePerMonth?: number | null;
  cleaningFee: number;
  currency: Currency;
  pricingTiers?: PricingTier[];
  capacity: number;
  minBookingHours: number | null;
  maxBookingHours: number | null;
  images: string[];
  videoUrl: string | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  instantBook: boolean;
  cancellationPolicy: CancellationPolicy;
  houseRules: string | null;
  createdAt: string;
  updatedAt: string;
  hostId: string;
  categorySlug: string;
  venueId: number;
  venue?: import("./venue").Venue;
  category?: SpaceCategory;
  amenities?: SpaceAmenity[];
  availability?: Availability[];
  averageRating?: number;
  totalReviews?: number;
}

export interface SpaceWithHost extends Space {
  host: {
    id: string;
    name: string | null;
    image: string | null;
    hostingSince: string | null;
  };
  venue?: import("./venue").Venue;
}

export const LEGACY_SPACE_TYPES = [
  "OFFICE_DESK",
  "PRIVATE_OFFICE",
  "MEETING_ROOM",
  "EVENT_VENUE",
  "WEDDING_VENUE",
  "COWORKING_SPACE",
] as const satisfies readonly SpaceType[];

export const SPACE_CATEGORY_GROUPS = [
  { name: "Business & Office", slug: "business-office", sortOrder: 1 },
  { name: "Events & Celebrations", slug: "events-celebrations", sortOrder: 2 },
  { name: "Creative & Media", slug: "creative-media", sortOrder: 3 },
  { name: "Retail & Commercial", slug: "retail-commercial", sortOrder: 4 },
  { name: "Sports & Wellness", slug: "sports-wellness", sortOrder: 5 },
  { name: "Industrial & Logistics", slug: "industrial-logistics", sortOrder: 6 },
] as const satisfies readonly Omit<SpaceCategoryGroup, "id">[];

export const SPACE_CATEGORIES = [
  { name: "Office Desk", slug: "office-desk", groupSlug: "business-office", sortOrder: 1 },
  { name: "Private Office", slug: "private-office", groupSlug: "business-office", sortOrder: 2 },
  {
    name: "Meeting & Training Room",
    slug: "meeting-training-room",
    groupSlug: "business-office",
    sortOrder: 3,
  },
  { name: "Coworking Space", slug: "coworking-space", groupSlug: "business-office", sortOrder: 4 },
  {
    name: "Large Conference Hall",
    slug: "large-conference-hall",
    groupSlug: "business-office",
    sortOrder: 5,
  },
  { name: "Event Venue", slug: "event-venue", groupSlug: "events-celebrations", sortOrder: 1 },
  {
    name: "Wedding Venue",
    slug: "wedding-venue",
    groupSlug: "events-celebrations",
    sortOrder: 2,
  },
  {
    name: "Rooftop Venue",
    slug: "rooftop-venue",
    groupSlug: "events-celebrations",
    sortOrder: 3,
  },
  {
    name: "Garden / Outdoor Space",
    slug: "garden-outdoor-space",
    groupSlug: "events-celebrations",
    sortOrder: 4,
  },
  {
    name: "Private Party Space",
    slug: "private-party-space",
    groupSlug: "events-celebrations",
    sortOrder: 5,
  },
  {
    name: "Private Function Room",
    slug: "private-function-room",
    groupSlug: "events-celebrations",
    sortOrder: 6,
  },
  {
    name: "Private Dining Room",
    slug: "private-dining-room",
    groupSlug: "events-celebrations",
    sortOrder: 7,
  },
  {
    name: "The VIP Suite / Private Lounge",
    slug: "vip-suite-private-lounge",
    groupSlug: "events-celebrations",
    sortOrder: 8,
  },
  {
    name: "Workshop / Maker Space",
    slug: "workshop-maker-space",
    groupSlug: "creative-media",
    sortOrder: 1,
  },
  {
    name: "Photo & Video Studio",
    slug: "photo-video-studio",
    groupSlug: "creative-media",
    sortOrder: 2,
  },
  { name: "Podcast Studio", slug: "podcast-studio", groupSlug: "creative-media", sortOrder: 3 },
  {
    name: "Dark Kitchen / Cloud Kitchen",
    slug: "dark-kitchen-cloud-kitchen",
    groupSlug: "creative-media",
    sortOrder: 4,
  },
  {
    name: "Private Cinema / Screening Room",
    slug: "private-cinema-screening-room",
    groupSlug: "creative-media",
    sortOrder: 5,
  },
  {
    name: "Gaming / Esports Lounge",
    slug: "gaming-esports-lounge",
    groupSlug: "creative-media",
    sortOrder: 6,
  },
  {
    name: "Retail Store / Shop Front",
    slug: "retail-store-shop-front",
    groupSlug: "retail-commercial",
    sortOrder: 1,
  },
  { name: "Pop-up Store", slug: "pop-up-store", groupSlug: "retail-commercial", sortOrder: 2 },
  { name: "Showroom", slug: "showroom", groupSlug: "retail-commercial", sortOrder: 3 },
  {
    name: "Yoga / Dance Studio",
    slug: "yoga-dance-studio",
    groupSlug: "sports-wellness",
    sortOrder: 1,
  },
  {
    name: "Sport Courts & Fields",
    slug: "sport-courts-fields",
    groupSlug: "sports-wellness",
    sortOrder: 2,
  },
  { name: "Indoor & Fitness", slug: "indoor-fitness", groupSlug: "sports-wellness", sortOrder: 3 },
  { name: "Sporturi de Nișă", slug: "specialty-sports", groupSlug: "sports-wellness", sortOrder: 4 },
  {
    name: "Micro-Warehouse / Storage",
    slug: "micro-warehouse-storage",
    groupSlug: "industrial-logistics",
    sortOrder: 1,
  },
  {
    name: "Warehouse / Storage Unit",
    slug: "warehouse-storage-unit",
    groupSlug: "industrial-logistics",
    sortOrder: 2,
  },
  {
    name: "Distribution Center",
    slug: "distribution-center",
    groupSlug: "industrial-logistics",
    sortOrder: 3,
  },
  { name: "Cold Storage", slug: "cold-storage", groupSlug: "industrial-logistics", sortOrder: 4 },
  { name: "Big Box Retail", slug: "big-box-retail", groupSlug: "industrial-logistics", sortOrder: 5 },
  {
    name: "Light Industrial / Workshop",
    slug: "light-industrial-workshop",
    groupSlug: "industrial-logistics",
    sortOrder: 6,
  },
] as const satisfies readonly Pick<SpaceCategory, "groupSlug" | "name" | "slug" | "sortOrder">[];

export const SPACE_TYPE_BY_CATEGORY_SLUG = {
  "office-desk": "OFFICE_DESK",
  "private-office": "PRIVATE_OFFICE",
  "meeting-training-room": "MEETING_ROOM",
  "coworking-space": "COWORKING_SPACE",
  "large-conference-hall": "MEETING_ROOM",
  "event-venue": "EVENT_VENUE",
  "wedding-venue": "WEDDING_VENUE",
  "rooftop-venue": "EVENT_VENUE",
  "garden-outdoor-space": "EVENT_VENUE",
  "private-party-space": "EVENT_VENUE",
  "private-function-room": "EVENT_VENUE",
  "private-dining-room": "EVENT_VENUE",
  "vip-suite-private-lounge": "EVENT_VENUE",
  "workshop-maker-space": "MEETING_ROOM",
  "photo-video-studio": "MEETING_ROOM",
  "podcast-studio": "MEETING_ROOM",
  "dark-kitchen-cloud-kitchen": "MEETING_ROOM",
  "private-cinema-screening-room": "MEETING_ROOM",
  "gaming-esports-lounge": "MEETING_ROOM",
  "retail-store-shop-front": "PRIVATE_OFFICE",
  "pop-up-store": "PRIVATE_OFFICE",
  "showroom": "PRIVATE_OFFICE",
  "yoga-dance-studio": "MEETING_ROOM",
  "sport-courts-fields": "MEETING_ROOM",
  "indoor-fitness": "MEETING_ROOM",
  "specialty-sports": "MEETING_ROOM",
  "micro-warehouse-storage": "PRIVATE_OFFICE",
  "warehouse-storage-unit": "PRIVATE_OFFICE",
  "distribution-center": "PRIVATE_OFFICE",
  "cold-storage": "PRIVATE_OFFICE",
  "big-box-retail": "PRIVATE_OFFICE",
  "light-industrial-workshop": "PRIVATE_OFFICE",
} as const satisfies Record<KnownSpaceCategorySlug, SpaceType>;

export const normalizeSpaceCategorySlug = (value: string): string =>
  value === "meeting-room" ? "meeting-training-room" : value;

export const deriveLegacySpaceTypeFromCategorySlug = (value: string): SpaceType | null => {
  const normalized = normalizeSpaceCategorySlug(value) as KnownSpaceCategorySlug;
  return SPACE_TYPE_BY_CATEGORY_SLUG[normalized] ?? null;
};

export const SpaceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shortDescription: z.string().min(10, "Short description must be at least 10 characters").max(150),
  description: z.string().min(50, "Description must be at least 50 characters"),
  spaceType: z.enum(LEGACY_SPACE_TYPES),
  pricingType: z.enum(["HOURLY", "DAILY", "BOTH", "MONTHLY"]),
  pricePerHour: z.number().nullable(),
  pricePerDay: z.number().nullable(),
  pricePerMonth: z.number().nullable().optional(),
  cleaningFee: z.number().min(0).default(0),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  minBookingHours: z.number().nullable(),
  maxBookingHours: z.number().nullable(),
  images: z.array(z.string()).min(1, "At least one image is required"),
  venueId: z.number().min(1, "Venue is required"),
  // Location fields are optional — populated from venue by the server
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().nullable().optional(),
  country: z.string().optional(),
  postalCode: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  instantBook: z.boolean().default(false),
  cancellationPolicy: z.enum(["FLEXIBLE", "MODERATE", "STRICT", "NON_REFUNDABLE"]).default("MODERATE"),
  houseRules: z.string().nullable(),
  categorySlug: z.string().min(1, "Category is required"),
  amenityIds: z.array(z.number()).default([]),
});

export const AvailabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  isOpen: z.boolean().default(true),
});

export const SpaceSearchSchema = z.object({
  city: z.string().optional(),
  spaceType: z.enum(LEGACY_SPACE_TYPES).optional(),
  categorySlug: z.string().optional(),
  groupSlug: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  capacity: z.number().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  amenities: z.array(z.number()).optional(),
  instantBook: z.boolean().optional(),
  sort: z.enum(["price_asc", "price_desc", "rating", "newest"]).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export type SpaceFormInput = z.infer<typeof SpaceFormSchema>;
export type AvailabilityInput = z.infer<typeof AvailabilitySchema>;
export type SpaceSearchInput = z.infer<typeof SpaceSearchSchema>;
