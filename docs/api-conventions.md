# API Conventions

Shared conventions for the SkillShift HTTP API and the realtime chat gateway. The complete route inventory is documented in Swagger at `/api/docs`.

## Base URLs

| Environment | Base URL |
| --- | --- |
| Local | `http://localhost:3000` |
| Production | `https://skillshift-api.duckdns.org` |

Swagger UI: `/api/docs` on either host.

Requests and responses are JSON (`application/json`); file contents are uploaded directly to S3. IDs are UUID strings and timestamps are ISO 8601 strings.

The web app calls the API through a same-origin Next.js proxy (`/api/backend/*`) so the refresh cookie stays first-party. Direct cross-origin requests are only accepted from the configured `FRONTEND_URL` origin.

## Response envelope

Successful responses wrap the payload:

```json
{ "data": { "id": "..." }, "meta": {} }
```

Paginated responses put pagination state in `meta`:

```json
{
  "data": [{ "id": "..." }],
  "meta": { "nextCursor": "9b1c...", "hasMore": true }
}
```

Errors use a consistent shape:

```json
{
  "statusCode": 400,
  "message": "Insufficient wallet balance",
  "path": "/orders",
  "timestamp": "2026-10-17T09:30:00.000Z"
}
```

`message` is always a single string; validation messages, which arrive from the validation layer as arrays, are joined with commas. Unhandled server errors return a generic `500` message — details stay in server logs.

## Status codes

| Code | Meaning |
| --- | --- |
| `200` / `201` / `204` | Success |
| `400` | Validation failure, malformed request, or an operation not allowed in the current state |
| `401` | Missing, invalid, or expired access token |
| `403` | Authenticated but not permitted (role or resource ownership) |
| `404` | Resource not found |
| `409` | Uniqueness conflict (for example an email that is already registered) |
| `429` | Rate limit exceeded |

## Validation

A global `ValidationPipe` runs with `transform`, `whitelist`, and `forbidNonWhitelisted` enabled:

- Unknown properties are rejected with `400`.
- Query and route parameters are coerced to their DTO types.
- Notable rules: passwords are at least 8 characters; ratings are 1–5; chat messages are at most 2,000 characters; uploads are 1 byte–5 MB.

## Authentication & sessions

- **Access token:** JWT sent as `Authorization: Bearer <token>`, payload `{ sub, email, role }`. Short-lived (`JWT_EXPIRES_IN`; 15 minutes in production).
- **Refresh token:** HttpOnly, Secure, SameSite=Lax cookie named `refreshToken`, scoped to `Path=/auth`, valid for 7 days. Tokens are stored hashed and rotated on every `POST /auth/refresh`; a password reset deletes all of a user's refresh tokens.
- **Guards:** authentication is required by default (global `JwtAuthGuard`); public endpoints opt out explicitly. `RolesGuard` enforces `CLIENT`, `FREELANCER`, and `ADMIN` roles, and resource ownership is verified in the service layer.
- **Client convention:** hold the access token for the session and, on `401`, refresh once and replay the original request. Concurrent failures should share a single refresh (single-flight), not stampede the endpoint.

## Pagination

Listing endpoints are cursor-paginated — never offset-based:

- Query: `?limit=<n>&cursor=<id>`. `limit` is typically 1–50 (default 20); `cursor` is the ID of the last item from the previous page.
- Response `meta`: `{ nextCursor, hasMore }`. When `hasMore` is `false`, you are on the last page.

Cursors keep pages stable while records are inserted or updated — for example, new chat messages or service listings.

## Money

All amounts are integers in **minor units** (paise): `349900` is ₹3,499.00. Requests must send minor units; the web app formats them for display. Floats are never used for money. No currency column is stored — the platform runs in a single currency.

## Rate limits

| Surface | Limit |
| --- | --- |
| Chat `send_message` | 30 messages per 60 seconds per user |
| `POST /auth/resend-verification` | 10 per hour per IP, plus a per-account cooldown |
| `POST /auth/forgot-password` | 5 per hour per IP |

HTTP limits return `429` with `Too many requests. Please try again later.`; chat rejects the message with a WebSocket exception (`Too many messages. Please slow down.`). Limits are counted in Redis, so they apply across API instances.

## Realtime chat

The chat gateway runs on the `/chat` namespace and authenticates during the handshake:

```js
const socket = io('https://skillshift-api.duckdns.org/chat', {
  auth: { token: 'Bearer <accessToken>' },
});
```

- Unauthenticated or invalid sockets are disconnected.
- Clients emit `join_order` with `{ orderId }` before receiving messages. Only order participants may join; the server acknowledges on `joined_order`.
- Client → server events: `ping`, `join_order`, `send_message`.
- Server → client events: `user_online`, `user_offline`, `new_message`.
- `send_message` payload: `{ orderId, content }`. Messages are persisted in PostgreSQL and broadcast to the order room.
- Presence uses Redis counters with a 30-second TTL and supports multiple sockets per user.

## File uploads

Uploads use a three-step presigned flow:

1. `POST /upload/presigned` with `{ resource, resourceId, fileName, contentType, fileSize }`.
2. `PUT` the file bytes directly to the returned S3 URL — no `Authorization` header; the presigned URL carries permission.
3. `POST /upload/confirm` with `{ resource, resourceId, key }`. The backend verifies the object with `HeadObject` before persisting metadata.

| Field | Values |
| --- | --- |
| `resource` | `avatar`, `service`, `portfolio`, `delivery` |
| `contentType` | `image/jpeg`, `image/png`, `application/pdf`, `application/zip` |
| `fileSize` | 1 byte–5 MB |

Delivery files are downloadable through `GET /upload/download-url`, which issues a short-lived URL only to order participants.

## Enums

Canonical enum values used across the API:

```text
Role             CLIENT · FREELANCER · ADMIN
ServiceStatus    PENDING_REVIEW · ACTIVE · REJECTED · PAUSED
OrderStatus      PENDING · IN_PROGRESS · DELIVERED · COMPLETED · DISPUTED · CANCELLED · REFUNDED
EscrowStatus     HOLDING · RELEASED · REFUNDED
DisputeStatus    OPEN · UNDER_REVIEW · RESOLVED_FREELANCER · RESOLVED_CLIENT
TransactionType  DEPOSIT · ESCROW_HOLD · ESCROW_RELEASE · ESCROW_REFUND · WITHDRAWAL
NotificationType ORDER_PLACED · ORDER_DELIVERED · ORDER_COMPLETED · ORDER_CANCELLED ·
                 DISPUTE_OPENED · DISPUTE_RESOLVED · MESSAGE_RECEIVED ·
                 PAYMENT_RECEIVED · REVIEW_RECEIVED
```
