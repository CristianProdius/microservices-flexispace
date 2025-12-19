import z from "zod";

// Enums
export type SpaceType =
  | "OFFICE_DESK"
  | "PRIVATE_OFFICE"
  | "MEETING_ROOM"
  | "EVENT_VENUE"
  | "WEDDING_VENUE"
  | "COWORKING_SPACE";

export type PricingType = "HOURLY" | "DAILY" | "BOTH";

export type CancellationPolicy = "FLEXIBLE" | "MODERATE" | "STRICT" | "NON_REFUNDABLE";

// Types
export interface SpaceCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

export interface Amenity {
  id: number;
  name: string;
  icon: string | null;
  category: string | null;
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
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "09:00" format
  endTime: string;   // "18:00" format
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
  depositPercent: number;
  capacity: number;
  minBookingHours: number | null;
  maxBookingHours: number | null;
  images: string[]; // Array of image URLs

  // Location
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;

  // Settings
  isActive: boolean;
  instantBook: boolean;
  cancellationPolicy: CancellationPolicy;
  houseRules: string | null;

  // Metadata
  createdAt: string;
  updatedAt: string;

  // Relations
  hostId: string;
  categorySlug: string;
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
}

// Zod Schemas
export const SpaceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shortDescription: z.string().min(10, "Short description must be at least 10 characters").max(150),
  description: z.string().min(50, "Description must be at least 50 characters"),
  spaceType: z.enum([
    "OFFICE_DESK",
    "PRIVATE_OFFICE",
    "MEETING_ROOM",
    "EVENT_VENUE",
    "WEDDING_VENUE",
    "COWORKING_SPACE",
  ]),
  pricingType: z.enum(["HOURLY", "DAILY", "BOTH"]),
  pricePerHour: z.number().nullable(),
  pricePerDay: z.number().nullable(),
  depositPercent: z.number().min(0).max(100).default(30),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  minBookingHours: z.number().nullable(),
  maxBookingHours: z.number().nullable(),
  images: z.array(z.string()).min(1, "At least one image is required"),

  // Location
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().nullable(),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),

  // Settings
  instantBook: z.boolean().default(false),
  cancellationPolicy: z.enum(["FLEXIBLE", "MODERATE", "STRICT", "NON_REFUNDABLE"]).default("MODERATE"),
  houseRules: z.string().nullable(),

  // Relations
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
  spaceType: z.enum([
    "OFFICE_DESK",
    "PRIVATE_OFFICE",
    "MEETING_ROOM",
    "EVENT_VENUE",
    "WEDDING_VENUE",
    "COWORKING_SPACE",
  ]).optional(),
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
