import type { SpaceType } from "@repo/db";

const SPACE_TYPE_BY_CATEGORY_SLUG: Record<string, SpaceType> = {
  "big-box-retail": "PRIVATE_OFFICE",
  "cold-storage": "PRIVATE_OFFICE",
  "coworking-space": "COWORKING_SPACE",
  "dark-kitchen-cloud-kitchen": "MEETING_ROOM",
  "distribution-center": "PRIVATE_OFFICE",
  "event-venue": "EVENT_VENUE",
  "gaming-esports-lounge": "MEETING_ROOM",
  "garden-outdoor-space": "EVENT_VENUE",
  "indoor-fitness": "MEETING_ROOM",
  "large-conference-hall": "MEETING_ROOM",
  "light-industrial-workshop": "PRIVATE_OFFICE",
  "meeting-training-room": "MEETING_ROOM",
  "micro-warehouse-storage": "PRIVATE_OFFICE",
  "office-desk": "OFFICE_DESK",
  "photo-video-studio": "MEETING_ROOM",
  "podcast-studio": "MEETING_ROOM",
  "pop-up-store": "PRIVATE_OFFICE",
  "private-cinema-screening-room": "MEETING_ROOM",
  "private-dining-room": "EVENT_VENUE",
  "private-function-room": "EVENT_VENUE",
  "private-office": "PRIVATE_OFFICE",
  "private-party-space": "EVENT_VENUE",
  "retail-store-shop-front": "PRIVATE_OFFICE",
  "rooftop-venue": "EVENT_VENUE",
  "showroom": "PRIVATE_OFFICE",
  "specialty-sports": "MEETING_ROOM",
  "sport-courts-fields": "MEETING_ROOM",
  "vip-suite-private-lounge": "EVENT_VENUE",
  "warehouse-storage-unit": "PRIVATE_OFFICE",
  "wedding-venue": "WEDDING_VENUE",
  "workshop-maker-space": "MEETING_ROOM",
  "yoga-dance-studio": "MEETING_ROOM",
} as const;

export const normalizeCategorySlug = (categorySlug: string) =>
  categorySlug === "meeting-room" ? "meeting-training-room" : categorySlug;

export const deriveLegacySpaceTypeFromCategorySlug = (
  categorySlug: string
): SpaceType | null => {
  const normalizedCategorySlug = normalizeCategorySlug(categorySlug);
  return SPACE_TYPE_BY_CATEGORY_SLUG[normalizedCategorySlug] ?? null;
};

export const buildCategoryPayload = <T extends Record<string, unknown>>(
  data: T,
): T & { categorySlug?: unknown; spaceType?: SpaceType } => {
  const normalizedCategorySlug =
    typeof data.categorySlug === "string"
      ? normalizeCategorySlug(data.categorySlug)
      : data.categorySlug;
  const derivedSpaceType =
    typeof normalizedCategorySlug === "string"
      ? deriveLegacySpaceTypeFromCategorySlug(normalizedCategorySlug)
      : null;

  return {
    ...data,
    ...(normalizedCategorySlug ? { categorySlug: normalizedCategorySlug } : {}),
    ...(derivedSpaceType ? { spaceType: derivedSpaceType } : {}),
  };
};
