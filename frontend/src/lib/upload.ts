/**
 * S3 presigned upload pipeline (frontend-context §2 / blueprint §10):
 *   POST /upload/presigned → raw PUT to S3 (no auth header) → POST /upload/confirm
 * Delivery downloads use GET /upload/download-url?key= (short-lived).
 */
import { apiFetch, ApiRequestError } from "./api-client";
import type { PresignedRequest, PresignedResponse } from "./types";

const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/zip",
]);

export function assertUploadable(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG, PDF, or ZIP files are allowed.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("File must be 5MB or smaller.");
  }
  if (file.size < 1) {
    throw new Error("File is empty.");
  }
}

export async function requestPresigned(
  body: PresignedRequest,
): Promise<PresignedResponse> {
  const { data } = await apiFetch<PresignedResponse>("/upload/presigned", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data;
}

export async function putToS3(url: string, file: File): Promise<void> {
  // Never attach the app auth header to the S3 PUT.
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error("Upload to storage failed. Please retry.");
}

export async function confirmUpload(body: PresignedRequest & { key: string }) {
  const { data } = await apiFetch<unknown>("/upload/confirm", {
    method: "POST",
    body: JSON.stringify({
      resource: body.resource,
      resourceId: body.resourceId,
      key: body.key,
    }),
  });
  return data;
}

export async function uploadFile(
  meta: PresignedRequest,
  file: File,
): Promise<string> {
  assertUploadable(file);
  const { url, key } = await requestPresigned(meta);
  await putToS3(url, file);
  await confirmUpload({ ...meta, key });
  return key;
}

function cause(err: unknown): string {
  if (err instanceof ApiRequestError) return `server ${err.statusCode}: ${err.message}`;
  if (err instanceof Error) return err.message;
  return "network error";
}

/**
 * Service-image upload with step-labeled errors (never a bare generic).
 * Confirm auto-appends the key to the service server-side.
 */
export async function uploadServiceImage(
  serviceId: string,
  file: File,
  index: number,
  total: number,
): Promise<string> {
  assertUploadable(file);
  const meta: PresignedRequest = {
    resource: "service",
    resourceId: serviceId,
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  };
  const label = total > 1 ? `Image ${index + 1} of ${total}` : "Image";
  let presigned: PresignedResponse;
  try {
    presigned = await requestPresigned(meta);
  } catch (err) {
    console.error("[studio] presigned request failed", err);
    throw new Error(`${label}: upload request failed (${cause(err)}).`);
  }
  try {
    await putToS3(presigned.url, file);
  } catch (err) {
    console.error("[studio] S3 PUT failed", err);
    throw new Error(`${label}: storage upload failed (${cause(err)}). The bucket may be unreachable.`);
  }
  try {
    await confirmUpload({ ...meta, key: presigned.key });
  } catch (err) {
    console.error("[studio] confirm failed", err);
    throw new Error(`${label}: verification failed (${cause(err)}).`);
  }
  return presigned.key;
}

/** Short-lived download URL for delivery files. */
export async function deliveryDownloadUrl(key: string): Promise<string> {
  const params = new URLSearchParams({ key });
  const { data } = await apiFetch<{ url: string }>(
    `/upload/download-url?${params.toString()}`,
    { method: "GET" },
  );
  return data.url;
}
