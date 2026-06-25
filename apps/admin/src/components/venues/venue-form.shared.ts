import type { Currency } from "@repo/types";

export const PRODUCT_SERVICE_URL =
  process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || "http://localhost:8000";

export const fieldClassName =
  "w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

export const labelClassName = "mb-1 block text-sm font-medium text-foreground";

export type WeekdayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const WEEKDAYS: WeekdayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export interface WorkingHoursDay {
  open: string;
  close: string;
}

export type WorkingHoursValue = Record<WeekdayKey, WorkingHoursDay | null>;

export const createEmptyWorkingHours = (): WorkingHoursValue => ({
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null,
  sunday: null,
});

export const sanitizeWorkingHours = (
  value: WorkingHoursValue
): WorkingHoursValue | null => {
  const hasAny = WEEKDAYS.some((day) => value[day] !== null);
  return hasAny ? value : null;
};

export interface VenueFormValues {
  name: string;
  shortDescription: string;
  description: string;
  nameTranslations: Record<string, string>;
  shortDescTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  videoUrl: string;
  currency: Currency;
  workingHours: WorkingHoursValue;
  venueVerified: boolean;
  venueRecommended: boolean;
  venueSponsored: boolean;
}

export interface VenueFormPayload {
  name: string;
  shortDescription: string;
  description: string;
  nameTranslations: Record<string, string> | null;
  shortDescTranslations: Record<string, string> | null;
  descriptionTranslations: Record<string, string> | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  videoUrl: string | null;
  currency: Currency;
  workingHours: WorkingHoursValue | null;
  venueVerified?: boolean;
  venueRecommended?: boolean;
  venueSponsored?: boolean;
  hostId?: string;
}

export const createEmptyVenueFormValues = (): VenueFormValues => ({
  name: "",
  shortDescription: "",
  description: "",
  nameTranslations: {},
  shortDescTranslations: {},
  descriptionTranslations: {},
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  latitude: null,
  longitude: null,
  images: [],
  videoUrl: "",
  currency: "USD",
  workingHours: createEmptyWorkingHours(),
  venueVerified: false,
  venueRecommended: false,
  venueSponsored: false,
});

const emptyToNull = (obj: Record<string, string>): Record<string, string> | null =>
  Object.keys(obj).length === 0 ? null : obj;

export const buildVenuePayload = (
  formData: VenueFormValues,
  options: { includeListingBadges?: boolean } = {}
): VenueFormPayload => {
  const payload: VenueFormPayload = {
    name: formData.name,
    shortDescription: formData.shortDescription,
    description: formData.description,
    nameTranslations: emptyToNull(formData.nameTranslations),
    shortDescTranslations: emptyToNull(formData.shortDescTranslations),
    descriptionTranslations: emptyToNull(formData.descriptionTranslations),
    address: formData.address,
    city: formData.city,
    state: formData.state || null,
    country: formData.country,
    postalCode: formData.postalCode || null,
    latitude: formData.latitude,
    longitude: formData.longitude,
    images: formData.images,
    videoUrl: formData.videoUrl || null,
    currency: formData.currency,
    workingHours: sanitizeWorkingHours(formData.workingHours),
  };

  if (options.includeListingBadges) {
    payload.venueVerified = formData.venueVerified;
    payload.venueRecommended = formData.venueRecommended;
    payload.venueSponsored = formData.venueSponsored;
  }

  return payload;
};

export interface VenueResponse {
  id: number;
  name: string;
  shortDescription: string;
  description: string;
  nameTranslations?: Record<string, string> | null;
  shortDescTranslations?: Record<string, string> | null;
  descriptionTranslations?: Record<string, string> | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  videoUrl?: string | null;
  workingHours?: WorkingHoursValue | null;
  currency: Currency;
  venueVerified?: boolean;
  venueRecommended?: boolean;
  venueSponsored?: boolean;
}

export const mapVenueToFormValues = (
  venue: VenueResponse
): VenueFormValues => ({
  name: venue.name,
  shortDescription: venue.shortDescription,
  description: venue.description,
  nameTranslations: venue.nameTranslations ?? {},
  shortDescTranslations: venue.shortDescTranslations ?? {},
  descriptionTranslations: venue.descriptionTranslations ?? {},
  address: venue.address,
  city: venue.city,
  state: venue.state ?? "",
  country: venue.country,
  postalCode: venue.postalCode ?? "",
  latitude: venue.latitude ?? null,
  longitude: venue.longitude ?? null,
  images: Array.isArray(venue.images) ? venue.images : [],
  videoUrl: venue.videoUrl ?? "",
  currency: venue.currency ?? "USD",
  workingHours: venue.workingHours ?? createEmptyWorkingHours(),
  venueVerified: venue.venueVerified ?? false,
  venueRecommended: venue.venueRecommended ?? false,
  venueSponsored: venue.venueSponsored ?? false,
});
