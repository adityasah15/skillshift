/**
 * Public image resolver.
 *
 * Backend quirk (documented, not worked around server-side):
 * `POST /upload/confirm` stores the raw S3 key (e.g. `services/<id>/a.jpg`)
 * in `service.imageUrls` / `profile.avatarUrl` — there is no public
 * resolver for those keys. `GET /upload/download-url` only serves
 * `deliveryFile` rows to order participants, so public pages cannot use it.
 *
 * Resolution order:
 *   1. Absolute `http(s)` URL → returned as-is (future-proof once the
 *      backend stores full URLs or a CDN base).
 *   2. Raw S3 key + `NEXT_PUBLIC_S3_PUBLIC_BASE` env (public bucket or
 *      CloudFront distribution, no trailing slash) → joined URL.
 *   3. Otherwise `undefined` → callers render the designed fallback
 *      (gradient + monogram), never a broken `<img>`.
 */
const PUBLIC_BASE = (process.env.NEXT_PUBLIC_S3_PUBLIC_BASE ?? "").replace(
  /\/+$/,
  "",
);

export function resolvePublicImage(
  src: string | null | undefined,
): string | undefined {
  if (!src) return undefined;
  const value = src.trim();
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (!PUBLIC_BASE) return undefined;
  const key = value.replace(/^\/+/, "");
  return `${PUBLIC_BASE}/${key}`;
}
