import { apiFetch } from "../api-client";
import type { SearchQuery, Service, ServiceQuery } from "../types";

function toParams(query: ServiceQuery & { q?: string }): string {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set("q", query.q.trim());
  // Backend ServiceQueryDto splits comma-separated `skills`; SearchServicesDto
  // accepts repeated `skills` keys. Comma form satisfies both validators.
  if (query.skills?.length) params.set("skills", query.skills.join(","));
  if (query.minPrice !== undefined) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== undefined) params.set("maxPrice", String(query.maxPrice));
  if (query.cursor) params.set("cursor", query.cursor);
  params.set("limit", String(query.limit ?? 20));
  return `?${params.toString()}`;
}

export const servicesApi = {
  /** Public. Paginated `{ data: Service[], meta: { cursor, hasMore } }`. */
  list(query: ServiceQuery = {}) {
    return apiFetch<Service[]>(`/services${toParams(query)}`, {
      method: "GET",
      auth: false,
    });
  },
  /** Public. Single service (ACTIVE only — pending uses internal preview). */
  get(id: string) {
    return apiFetch<Service>(`/services/${encodeURIComponent(id)}`, {
      method: "GET",
      auth: false,
    });
  },
  /** FREELANCER. Own listings including non-ACTIVE. */
  mine() {
    return apiFetch<Service[]>("/services/mine", { method: "GET" });
  },
  /** FREELANCER. Whitelist-exact create body. Images upload after (needs the id). */
  create(body: {
    title: string;
    description: string;
    price: number;
    deliveryDays: number;
    skills: string[];
    imageUrls: string[];
  }) {
    return apiFetch<Service>("/services", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  /** FREELANCER owner. Partial — only whitelisted fields. No status flips. */
  update(id: string, body: Partial<Pick<Service, "title" | "description" | "price" | "deliveryDays" | "skills" | "imageUrls">>) {
    return apiFetch<Service>(`/services/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
  /** FREELANCER owner. Soft delete. */
  remove(id: string) {
    return apiFetch<unknown>(`/services/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};

export const searchApi = {
  /** Public full-text search. Same envelope as list. */
  services(query: SearchQuery = {}) {
    return apiFetch<Service[]>(`/search/services${toParams(query)}`, {
      method: "GET",
      auth: false,
    });
  },
};
