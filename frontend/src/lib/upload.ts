/**
 * S3 presigned upload pipeline (frontend-context §2 / blueprint §10):
 *   POST /upload/presigned → raw PUT to S3 (no auth header) → POST /upload/confirm
 * Delivery downloads use GET /upload/download-url?key= (short-lived).
 */
import { apiFetch } from "./api-client";
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

/** Short-lived download URL for delivery files. */
export async function deliveryDownloadUrl(key: string): Promise<string> {
  const params = new URLSearchParams({ key });
  const { data } = await apiFetch<{ url: string }>(
    `/upload/download-url?${params.toString()}`,
    { method: "GET" },
  );
  return data.url;
}
