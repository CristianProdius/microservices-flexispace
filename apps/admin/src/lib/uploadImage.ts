import { apiFetch } from "@/lib/apiFetch";

const PRODUCT_SERVICE_URL =
  process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || "http://localhost:8000";

/**
 * Upload a single image to the product-service and return the persisted URL.
 *
 * Used by `<VenueForm>` and `<SpaceForm>` — both used to inline the same raw
 * `fetch(...)` call which skipped the shared `apiFetch` wrapper and therefore
 * never attached `X-Acting-Host-Id`. The consequence was that when an admin
 * acted as a host, the image was uploaded under the admin's S3 prefix and
 * `req.userId` instead of the impersonated host's id (the bug behind the
 * "Update venue silently doesn't save the new photo" report).
 *
 * `apiFetch` handles auth headers automatically. Do NOT set a manual
 * `Content-Type: multipart/form-data` here — the browser must add it with
 * the correct boundary.
 */
export async function uploadImage(file: File): Promise<{ url: string }> {
  const body = new FormData();
  body.append("file", file);

  const response = await apiFetch(`${PRODUCT_SERVICE_URL}/uploads/images`, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    let message = "Failed to upload image";
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Response wasn't JSON — keep the default message.
    }
    throw new Error(message);
  }

  return response.json();
}
