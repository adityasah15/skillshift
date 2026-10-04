import { apiFetch } from "../api-client";
import type { ServiceReview } from "../types";

export const reviewsApi = {
  /** Public. Returns array directly (wrapped in envelope by interceptor). */
  forService(serviceId: string) {
    return apiFetch<ServiceReview[]>(
      `/reviews/services/${encodeURIComponent(serviceId)}`,
      { method: "GET", auth: false },
    );
  },
};
