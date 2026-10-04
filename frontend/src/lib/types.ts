/**
 * Contract-driven API types.
 * Reflect actual controller payloads (see docs/frontend-context.md),
 * not 1:1 Prisma models. Money = integer minor units (paise).
 */

export type Role = "CLIENT" | "FREELANCER" | "ADMIN";

export type ServiceStatus =
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "REJECTED"
  | "PAUSED";

export interface Service {
  id: string;
  freelancerId: string;
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  skills: string[];
  imageUrls: string[];
  status: ServiceStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface PageMeta {
  cursor: string | null;
  hasMore: boolean;
}

export interface Envelope<T> {
  data: T;
  meta: Partial<PageMeta> & Record<string, unknown>;
}

export interface ServiceQuery {
  cursor?: string;
  limit?: number;
  skills?: string[];
  minPrice?: number;
  maxPrice?: number;
}

export interface SearchQuery extends ServiceQuery {
  q?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface AccessTokenPayload {
  accessToken: string;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  path?: string;
  timestamp?: string;
}

export type UploadResource = "avatar" | "service" | "portfolio" | "delivery";

export interface PresignedRequest {
  resource: UploadResource;
  resourceId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
}

export interface PresignedResponse {
  key: string;
  url: string;
}
