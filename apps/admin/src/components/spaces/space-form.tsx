"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Upload, X } from "lucide-react";

import { DashboardPageHeader, DashboardSection } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/apiFetch";
import { uploadImage } from "@/lib/uploadImage";
import {
  findCategoryBySlug,
  flattenCategoryGroups,
  normalizeCategoryGroups,
  normalizeCategorySlug,
  resolveLegacySpaceType,
  type NormalizedTaxonomyCategoryGroup,
  type TaxonomyApiResponse,
} from "@/lib/taxonomy";
import type { Amenity } from "@repo/types";

import {
  PRODUCT_SERVICE_URL,
  buildSpacePayload,
  cancellationPolicies,
  createEmptySpaceFormValues,
  fieldClassName,
  labelClassName,
  pricingTypes,
  weekdayLabels,
  type AvailabilityFormValue,
  type SpaceFormPayload,
  type SpaceFormValues,
} from "./space-form.shared";
import PricingTiersEditor from "./pricing-tiers-editor";
import TranslationTabs from "@/components/translation-tabs";

interface VenueOption {
  id: number;
  name: string;
  city: string;
  country: string;
}

interface SpaceFormProps {
  title: string;
  description: string;
  backHref: string;
  initialValues?: SpaceFormValues;
  defaultVenueId?: number;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (payload: SpaceFormPayload) => Promise<void>;
}

const getInitialSpaceFormValues = (
  initialValues: SpaceFormValues | undefined,
  defaultVenueId: number | undefined,
) => {
  const values = initialValues ?? createEmptySpaceFormValues();
  if (defaultVenueId && !values.venueId) {
    return { ...values, venueId: defaultVenueId };
  }
  return values;
};

const SpaceForm = ({
  title,
  description,
  backHref,
  initialValues,
  defaultVenueId,
  submitLabel,
  submittingLabel,
  onSubmit,
}: SpaceFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryGroups, setCategoryGroups] = useState<
    NormalizedTaxonomyCategoryGroup[]
  >(() => normalizeCategoryGroups([]));
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SpaceFormValues>(() =>
    getInitialSpaceFormValues(initialValues, defaultVenueId),
  );
  const categories = useMemo(
    () => flattenCategoryGroups(categoryGroups),
    [categoryGroups],
  );
  const selectedCategory = findCategoryBySlug(
    categories,
    formData.categorySlug,
  );
  const hasOpenAvailability = formData.availability.some((day) => day.isOpen);

  useEffect(() => {
    setFormData(getInitialSpaceFormValues(initialValues, defaultVenueId));
  }, [initialValues, defaultVenueId]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const catRes = await fetch(
          `${PRODUCT_SERVICE_URL}/categories?grouped=true`,
        );

        if (catRes.ok) {
          const catData = (await catRes.json()) as TaxonomyApiResponse;
          setCategoryGroups(normalizeCategoryGroups(catData));
        }
      } catch (fetchError) {
        console.error("Error fetching categories:", fetchError);
      }
    };

    const fetchVenues = async () => {
      try {
        // Use apiFetch so the host-switcher's X-Acting-Host-Id header is
        // attached when an admin is acting as a specific host. Without it the
        // call goes out as plain admin and `getMyVenues` returns the admin's
        // own (empty) venues, leaving the "Select Venue" dropdown empty.
        const res = await apiFetch(`${PRODUCT_SERVICE_URL}/venues/host/my`);

        if (res.ok) {
          const venueData = (await res.json()) as VenueOption[];
          setVenues(venueData);
        }
      } catch (fetchError) {
        console.error("Error fetching venues:", fetchError);
      }
    };

    fetchCategories();
    fetchVenues();
  }, []);

  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        const spaceType = formData.spaceType;
        const amenityUrl = spaceType
          ? `${PRODUCT_SERVICE_URL}/amenities?spaceType=${spaceType}`
          : `${PRODUCT_SERVICE_URL}/amenities`;
        const amenRes = await fetch(amenityUrl);

        if (amenRes.ok) {
          const amenData = (await amenRes.json()) as Amenity[];
          setAmenities(amenData);
        }
      } catch (fetchError) {
        console.error("Error fetching amenities:", fetchError);
      }
    };

    fetchAmenities();
  }, [formData.spaceType]);

  useEffect(() => {
    if (categories.length === 0 || !formData.categorySlug) {
      return;
    }

    setFormData((prev) => {
      const nextCategorySlug = normalizeCategorySlug(
        prev.categorySlug,
        categories,
      );
      const nextCategory = findCategoryBySlug(categories, nextCategorySlug);
      const nextSpaceType = nextCategory
        ? resolveLegacySpaceType(nextCategory, prev.spaceType)
        : prev.spaceType;

      if (
        nextCategorySlug === prev.categorySlug &&
        nextSpaceType === prev.spaceType
      ) {
        return prev;
      }

      return {
        ...prev,
        categorySlug: nextCategorySlug,
        spaceType: nextSpaceType,
      };
    });
  }, [categories, formData.categorySlug]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    setUploadingImage(true);
    setUploadError(null);

    try {
      for (const file of Array.from(files)) {
        const { url } = await uploadImage(file);
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, url],
        }));
      }
    } catch (uploadingError) {
      console.error("Error uploading image:", uploadingError);
      setUploadError(
        uploadingError instanceof Error
          ? uploadingError.message
          : "Failed to upload image",
      );
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const toggleAmenity = (amenityId: number) => {
    setFormData((prev) => ({
      ...prev,
      amenityIds: prev.amenityIds.includes(amenityId)
        ? prev.amenityIds.filter((id) => id !== amenityId)
        : [...prev.amenityIds, amenityId],
    }));
  };

  const updateAvailability = (
    dayOfWeek: number,
    changes: Partial<Omit<AvailabilityFormValue, "dayOfWeek">>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      availability: prev.availability.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...changes } : day,
      ),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!hasOpenAvailability) {
        throw new Error("Select at least one open availability day");
      }
      const invalidAvailabilityDay = formData.availability.find(
        (day) => day.isOpen && day.endTime <= day.startTime,
      );

      if (invalidAvailabilityDay) {
        throw new Error(
          `${weekdayLabels[invalidAvailabilityDay.dayOfWeek]} end time must be after start time`,
        );
      }

      const normalizedCategorySlug = normalizeCategorySlug(
        formData.categorySlug,
        categories,
      );
      const category = findCategoryBySlug(categories, normalizedCategorySlug);

      await onSubmit(
        buildSpacePayload(
          {
            ...formData,
            categorySlug: normalizedCategorySlug,
          },
          category,
        ),
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "An error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={title}
        description={description}
        action={
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ArrowLeft className="size-4" />
            Back to Spaces
          </Link>
        }
      />

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <DashboardSection
          title="Basic Information"
          contentClassName="space-y-4"
        >
          <div className="space-y-4">
            <div>
              <label className={labelClassName}>Space Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                }
                className={fieldClassName}
                placeholder="e.g. Modern Downtown Meeting Room"
              />
            </div>

            <div>
              <label className={labelClassName}>Short Description</label>
              <input
                type="text"
                required
                maxLength={150}
                value={formData.shortDescription}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    shortDescription: event.target.value,
                  }))
                }
                className={fieldClassName}
                placeholder="Brief description for search results"
              />
            </div>

            <div>
              <label className={labelClassName}>Full Description</label>
              <textarea
                required
                minLength={50}
                rows={4}
                value={formData.description}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                className={`${fieldClassName} min-h-28 resize-y`}
                placeholder="Detailed description of your space"
              />
            </div>

            <TranslationTabs
              fields={[
                {
                  name: "name",
                  label: "Name",
                  type: "input",
                  value: formData.name,
                  translations: formData.nameTranslations,
                  onTranslationChange: (lang, val) =>
                    setFormData((prev) => ({
                      ...prev,
                      nameTranslations: {
                        ...prev.nameTranslations,
                        [lang]: val,
                      },
                    })),
                },
                {
                  name: "shortDescription",
                  label: "Short Description",
                  type: "input",
                  value: formData.shortDescription,
                  translations: formData.shortDescTranslations,
                  onTranslationChange: (lang, val) =>
                    setFormData((prev) => ({
                      ...prev,
                      shortDescTranslations: {
                        ...prev.shortDescTranslations,
                        [lang]: val,
                      },
                    })),
                },
                {
                  name: "description",
                  label: "Description",
                  type: "textarea",
                  value: formData.description,
                  translations: formData.descriptionTranslations,
                  onTranslationChange: (lang, val) =>
                    setFormData((prev) => ({
                      ...prev,
                      descriptionTranslations: {
                        ...prev.descriptionTranslations,
                        [lang]: val,
                      },
                    })),
                },
              ]}
            />

            <div>
              <label className={labelClassName}>Category</label>
              <select
                required
                value={formData.categorySlug}
                onChange={(event) =>
                  setFormData((prev) => {
                    const categorySlug = event.target.value;
                    const category = findCategoryBySlug(
                      categories,
                      categorySlug,
                    );

                    return {
                      ...prev,
                      categorySlug,
                      spaceType: category
                        ? resolveLegacySpaceType(category, prev.spaceType)
                        : prev.spaceType,
                    };
                  })
                }
                className={fieldClassName}
              >
                <option value="">Select a category</option>
                {categoryGroups.map((group) =>
                  group.categories.length > 0 ? (
                    <optgroup key={group.slug} label={group.name}>
                      {group.categories.map((category) => (
                        <option key={category.id} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </optgroup>
                  ) : null,
                )}
              </select>
              <p className="mt-2 text-sm text-muted-foreground">
                {selectedCategory
                  ? `Group: ${selectedCategory.group.name}`
                  : "Choose the category that best matches this space. The legacy space type is set automatically."}
              </p>
            </div>

            <div>
              <label className={labelClassName}>Capacity</label>
              <input
                type="number"
                required
                min="1"
                value={formData.capacity}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    capacity: event.target.value,
                  }))
                }
                className={fieldClassName}
                placeholder="Maximum number of people"
              />
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Images" contentClassName="space-y-4">
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {formData.images.map((imageUrl, index) => (
              <div
                key={`${imageUrl}-${index}`}
                className="relative aspect-square overflow-hidden rounded-lg border border-border/60 bg-accent/20"
              >
                <Image
                  src={imageUrl}
                  alt={`Space ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  aria-label={`Remove image ${index + 1}`}
                  className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-destructive text-white shadow-sm transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60 bg-accent/20 px-4 text-center transition-colors hover:border-primary/40 hover:bg-accent/30">
              {uploadingImage ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Upload
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {uploadError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {uploadError}
            </p>
          )}

          <p className="text-sm text-muted-foreground">
            Upload high-quality photos of your space. First image will be the
            cover.
          </p>

          <div>
            <label className={labelClassName}>
              YouTube Video URL (optional)
            </label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={formData.videoUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, videoUrl: e.target.value }))
              }
              className={fieldClassName}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Paste a YouTube link to embed a video on the listing page
            </p>
          </div>
        </DashboardSection>

        <DashboardSection title="Venue" contentClassName="space-y-4">
          <div>
            <label className={labelClassName}>Select Venue *</label>
            <select
              value={formData.venueId ?? ""}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  venueId: parseInt(event.target.value) || null,
                }))
              }
              className={fieldClassName}
              required
            >
              <option value="">Select a venue...</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {v.city}, {v.country}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground mt-1">
              <a
                href="/host/venues/new"
                className="text-primary hover:underline"
              >
                + Create new venue
              </a>
            </p>
          </div>
        </DashboardSection>

        <DashboardSection title="Pricing" contentClassName="space-y-4">
          <div className="space-y-4">
            <div>
              <label className={labelClassName}>Currency</label>
              <select
                value={formData.currency}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    currency: event.target.value as SpaceFormValues["currency"],
                  }))
                }
                className={fieldClassName}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (&euro;)</option>
                <option value="MDL">MDL (L)</option>
              </select>
            </div>

            <div>
              <label className={labelClassName}>Pricing Type</label>
              <select
                required
                value={formData.pricingType}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    pricingType: event.target
                      .value as SpaceFormValues["pricingType"],
                  }))
                }
                className={fieldClassName}
              >
                {pricingTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {(formData.pricingType === "HOURLY" ||
                formData.pricingType === "BOTH") && (
                <div>
                  <label className={labelClassName}>Price Per Hour</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.pricePerHour}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        pricePerHour: event.target.value,
                      }))
                    }
                    className={fieldClassName}
                    placeholder="$"
                  />
                </div>
              )}

              {(formData.pricingType === "DAILY" ||
                formData.pricingType === "BOTH") && (
                <div>
                  <label className={labelClassName}>Price Per Day</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.pricePerDay}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        pricePerDay: event.target.value,
                      }))
                    }
                    className={fieldClassName}
                    placeholder="$"
                  />
                </div>
              )}
            </div>

            <PricingTiersEditor
              tiers={formData.pricingTiers}
              onChange={(tiers) =>
                setFormData((prev) => ({ ...prev, pricingTiers: tiers }))
              }
              currency={formData.currency}
            />
          </div>
        </DashboardSection>

        <DashboardSection title="Availability">
          <div className="overflow-hidden rounded-lg border border-border/60">
            <div className="hidden grid-cols-[1fr_88px_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-border/60 bg-accent/20 px-4 py-3 text-sm font-medium text-muted-foreground sm:grid">
              <span>Day</span>
              <span>Open</span>
              <span>Start</span>
              <span>End</span>
            </div>
            <div className="divide-y divide-border/60">
              {formData.availability.map((day) => (
                <div
                  key={day.dayOfWeek}
                  className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 px-4 py-3 sm:grid-cols-[1fr_88px_minmax(0,1fr)_minmax(0,1fr)]"
                >
                  <span className="col-span-3 text-sm font-medium text-foreground sm:col-span-1">
                    {weekdayLabels[day.dayOfWeek]}
                  </span>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={day.isOpen}
                      onChange={(event) =>
                        updateAvailability(day.dayOfWeek, {
                          isOpen: event.target.checked,
                        })
                      }
                      aria-label={`${weekdayLabels[day.dayOfWeek]} open`}
                      className="h-5 w-5 rounded border-input text-primary focus:ring-2 focus:ring-ring/50 dark:bg-input/30"
                    />
                  </label>
                  <input
                    type="time"
                    required={day.isOpen}
                    disabled={!day.isOpen}
                    value={day.startTime}
                    onChange={(event) =>
                      updateAvailability(day.dayOfWeek, {
                        startTime: event.target.value,
                      })
                    }
                    aria-label={`${weekdayLabels[day.dayOfWeek]} start time`}
                    className={`${fieldClassName} min-w-0 py-2 disabled:bg-accent/20`}
                  />
                  <input
                    type="time"
                    required={day.isOpen}
                    disabled={!day.isOpen}
                    value={day.endTime}
                    onChange={(event) =>
                      updateAvailability(day.dayOfWeek, {
                        endTime: event.target.value,
                      })
                    }
                    aria-label={`${weekdayLabels[day.dayOfWeek]} end time`}
                    className={`${fieldClassName} min-w-0 py-2 disabled:bg-accent/20`}
                  />
                </div>
              ))}
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Amenities">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {amenities.map((amenity) => (
              <button
                key={amenity.id}
                type="button"
                onClick={() => toggleAmenity(amenity.id)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                  formData.amenityIds.includes(amenity.id)
                    ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                    : "border-border/60 bg-card text-card-foreground hover:bg-accent/30"
                }`}
              >
                {formData.amenityIds.includes(amenity.id) ? (
                  <Check className="h-4 w-4" />
                ) : null}
                {amenity.name}
              </button>
            ))}
          </div>
        </DashboardSection>

        <DashboardSection title="Settings" contentClassName="space-y-4">
          <div className="space-y-4">
            <div>
              <label className={labelClassName}>Cancellation Policy</label>
              <select
                required
                value={formData.cancellationPolicy}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    cancellationPolicy: event.target
                      .value as SpaceFormValues["cancellationPolicy"],
                  }))
                }
                className={fieldClassName}
              >
                {cancellationPolicies.map((policy) => (
                  <option key={policy.value} value={policy.value}>
                    {policy.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClassName}>House Rules</label>
              <textarea
                rows={3}
                value={formData.houseRules}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    houseRules: event.target.value,
                  }))
                }
                className={`${fieldClassName} min-h-24 resize-y`}
                placeholder="Any rules guests should know about"
              />
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-accent/20 px-4 py-3">
              <input
                type="checkbox"
                id="instantBook"
                checked={formData.instantBook}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    instantBook: event.target.checked,
                  }))
                }
                className="h-5 w-5 rounded border-input text-primary focus:ring-2 focus:ring-ring/50 dark:bg-input/30"
              />
              <label
                htmlFor="instantBook"
                className="text-sm text-muted-foreground"
              >
                Enable instant booking (guests can book without approval)
              </label>
            </div>
          </div>
        </DashboardSection>

        <div className="flex items-center justify-end gap-4">
          <Button asChild variant="ghost">
            <Link href={backHref}>Cancel</Link>
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={loading || formData.images.length === 0}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {submittingLabel}
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SpaceForm;
