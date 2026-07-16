"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, BadgeCheck, Loader2, Megaphone, Star, Upload, X } from "lucide-react";

const MapPickerDynamic = dynamic(() => import("./map-picker"), { ssr: false });

import { DashboardPageHeader, DashboardSection } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/uploadImage";

import {
  WEEKDAYS,
  buildVenuePayload,
  createEmptyVenueFormValues,
  fieldClassName,
  labelClassName,
  type VenueFormPayload,
  type VenueFormValues,
  type WeekdayKey,
  type WorkingHoursDay,
} from "./venue-form.shared";
import TranslationTabs from "@/components/translation-tabs";

interface VenueFormProps {
  title: string;
  description: string;
  backHref: string;
  initialValues?: VenueFormValues;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (payload: VenueFormPayload) => Promise<void>;
  hostField?: React.ReactNode;
  allowListingBadgeControls?: boolean;
}

// The "Verified" badge is driven off the `venueVerificationStatus` enum, while
// Recommended/Sponsored remain booleans on the form values.
const verifiedBadgeOption = {
  label: "Verified",
  description: "Marks this venue as checked by the platform.",
  icon: BadgeCheck,
} as const;

const booleanBadgeOptions = [
  {
    key: "venueRecommended",
    label: "Recommended",
    description: "Lifts this venue above ordinary verified venues.",
    icon: Star,
  },
  {
    key: "venueSponsored",
    label: "Sponsored",
    description: "Gives this venue the highest listing priority.",
    icon: Megaphone,
  },
] as const;

const VenueForm = ({
  title,
  description,
  backHref,
  initialValues,
  submitLabel,
  submittingLabel,
  onSubmit,
  hostField,
  allowListingBadgeControls = false,
}: VenueFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formData, setFormData] = useState<VenueFormValues>(
    initialValues ?? createEmptyVenueFormValues()
  );

  useEffect(() => {
    setFormData(initialValues ?? createEmptyVenueFormValues());
  }, [initialValues]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
          : "Failed to upload image"
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(
        buildVenuePayload(formData, {
          includeListingBadges: allowListingBadgeControls,
        })
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "An error occurred"
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
            Back to Venues
          </Link>
        }
      />

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {hostField}
        <DashboardSection title="Basic Information" contentClassName="space-y-4">
          <div className="space-y-4">
            <div>
              <label className={labelClassName}>Venue Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                }
                className={fieldClassName}
                placeholder="e.g. Downtown Innovation Hub"
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
                placeholder="Detailed description of your venue"
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
                      nameTranslations: { ...prev.nameTranslations, [lang]: val },
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
                      shortDescTranslations: { ...prev.shortDescTranslations, [lang]: val },
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
                      descriptionTranslations: { ...prev.descriptionTranslations, [lang]: val },
                    })),
                },
              ]}
            />

            <div>
              <label className={labelClassName}>Default Currency</label>
              <select
                value={formData.currency}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    currency: event.target.value as VenueFormValues["currency"],
                  }))
                }
                className={fieldClassName}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (&euro;)</option>
                <option value="MDL">MDL (L)</option>
              </select>
              <p className="mt-1 text-sm text-muted-foreground">
                This currency will be used as the default for spaces in this venue.
              </p>
            </div>
          </div>
        </DashboardSection>

        {allowListingBadgeControls && (
          <DashboardSection
            title="Listing badges"
            description="Sponsored venues rank first, then recommended, then verified."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {(() => {
                const VerifiedIcon = verifiedBadgeOption.icon;
                return (
                  <label className="flex items-start gap-3 rounded-md border border-border/60 bg-background px-3 py-3">
                    <input
                      type="checkbox"
                      checked={formData.venueVerificationStatus === "VERIFIED"}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          venueVerificationStatus: event.target.checked
                            ? "VERIFIED"
                            : "UNVERIFIED",
                        }))
                      }
                      className="mt-1"
                    />
                    <span className="flex min-w-0 gap-3">
                      <VerifiedIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="text-sm font-medium">
                          {verifiedBadgeOption.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {verifiedBadgeOption.description}
                        </span>
                      </span>
                    </span>
                  </label>
                );
              })()}
              {booleanBadgeOptions.map(({ key, label, description, icon: Icon }) => (
                <label
                  key={key}
                  className="flex items-start gap-3 rounded-md border border-border/60 bg-background px-3 py-3"
                >
                  <input
                    type="checkbox"
                    checked={formData[key]}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        [key]: event.target.checked,
                      }))
                    }
                    className="mt-1"
                  />
                  <span className="flex min-w-0 gap-3">
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {description}
                      </span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </DashboardSection>
        )}

        <DashboardSection title="Images" contentClassName="space-y-4">
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {formData.images.map((imageUrl, index) => (
              <div
                key={`${imageUrl}-${index}`}
                className="relative aspect-square overflow-hidden rounded-lg border border-border/60 bg-accent/20"
              >
                <Image
                  src={imageUrl}
                  alt={`Venue ${index + 1}`}
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
            Upload high-quality photos of your venue. First image will be the
            cover.
          </p>

          <div>
            <label className={labelClassName}>YouTube Video URL (optional)</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={formData.videoUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
              className={fieldClassName}
            />
            <p className="text-sm text-muted-foreground mt-1">Paste a YouTube link to embed a video on the listing page</p>
          </div>
        </DashboardSection>

        <DashboardSection title="Location" contentClassName="space-y-4">
          <div className="space-y-4">
            <div>
              <label className={labelClassName}>Address</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: event.target.value,
                  }))
                }
                className={fieldClassName}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <label className={labelClassName}>City</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      city: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      state: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Country</label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      country: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Postal Code</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      postalCode: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                />
              </div>
            </div>

            <div>
              <label className={labelClassName}>Location on Map (click to set pin)</label>
              <MapPickerDynamic
                latitude={formData.latitude}
                longitude={formData.longitude}
                onChange={(lat, lng) =>
                  setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))
                }
              />
              {formData.latitude != null && formData.longitude != null && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </DashboardSection>

        <DashboardSection
          title="Working hours"
          description="Set per-day open/close times. Leave a day closed to omit it from the public venue page."
        >
          <div className="space-y-2">
            {WEEKDAYS.map((day: WeekdayKey) => {
              const value = formData.workingHours[day];
              const isOpen = value !== null;
              const setDay = (next: WorkingHoursDay | null) => {
                setFormData((prev) => ({
                  ...prev,
                  workingHours: { ...prev.workingHours, [day]: next },
                }));
              };
              return (
                <div
                  key={day}
                  className="grid grid-cols-[120px_100px_1fr_1fr] items-center gap-3"
                >
                  <span className="text-sm capitalize">{day}</span>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isOpen}
                      aria-label={`${day} open`}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setDay({ open: "09:00", close: "18:00" });
                        } else {
                          setDay(null);
                        }
                      }}
                    />
                    Open
                  </label>
                  <input
                    type="time"
                    disabled={!isOpen}
                    aria-label={`${day} opening time`}
                    value={value?.open ?? ""}
                    onChange={(event) =>
                      setDay({
                        open: event.target.value,
                        close: value?.close ?? "18:00",
                      })
                    }
                    className={fieldClassName}
                  />
                  <input
                    type="time"
                    disabled={!isOpen}
                    aria-label={`${day} closing time`}
                    value={value?.close ?? ""}
                    onChange={(event) =>
                      setDay({
                        open: value?.open ?? "09:00",
                        close: event.target.value,
                      })
                    }
                    className={fieldClassName}
                  />
                </div>
              );
            })}
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

export default VenueForm;
