import type { Currency } from "./currency";

export interface WorkingHoursDay {
  open: string;
  close: string;
}

export type WeekdayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type WorkingHours = Record<WeekdayKey, WorkingHoursDay | null>;

export interface Venue {
  id: number;
  name: string;
  shortDescription: string;
  description: string;
  nameTranslations?: Record<string, string> | null;
  shortDescTranslations?: Record<string, string> | null;
  descriptionTranslations?: Record<string, string> | null;
  images: string[];
  videoUrl: string | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  workingHours?: WorkingHours | null;
  currency?: Currency;
  venueVerified: boolean;
  venueRecommended: boolean;
  venueSponsored: boolean;
  hostId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VenueHostSummary {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  bio?: string | null;
  hostingSince?: string | null;
  hostVerified: boolean;
  hostRecommended: boolean;
  hostSponsored: boolean;
}

export interface VenueWithHost extends Venue {
  host: VenueHostSummary;
}

export interface VenueSpaceSummary {
  id: number;
  name: string;
  spaceType: string;
  capacity: number;
  pricePerHour: number | null;
  pricePerDay: number | null;
  pricingType: string;
  currency?: Currency;
  images: string[];
  isActive: boolean;
  city: string;
  country: string;
  instantBook?: boolean;
}

export interface VenueWithSpaces extends Venue {
  spaces: VenueSpaceSummary[];
  _count?: { spaces: number };
}

export interface VenueDetail extends VenueWithHost {
  spaces: VenueSpaceSummary[];
}

export interface HostSummary {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  coverImage: string | null;
  bio: string | null;
  hostingSince: string | null;
  hostVerified: boolean;
  hostRecommended: boolean;
  hostSponsored: boolean;
  venueCount: number;
  spaceCount: number;
  cities: string[];
}

export interface HostVenueCard {
  id: number;
  name: string;
  shortDescription: string;
  city: string;
  country: string;
  images: string[];
  isActive: boolean;
  venueVerified: boolean;
  venueRecommended: boolean;
  venueSponsored: boolean;
  spaces: VenueSpaceSummary[];
  _count?: { spaces: number };
}

export interface HostDetail extends HostSummary {
  venues: HostVenueCard[];
}
