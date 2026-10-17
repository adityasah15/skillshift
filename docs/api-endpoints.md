# API Endpoints

The complete HTTP route surface of the SkillShift API, grouped by domain. The live
[Swagger UI](https://skillshift-api.duckdns.org/api/docs) remains the interactive reference;
this page is the readable route map for the repository.

Cross-cutting behavior — response envelopes, authentication, pagination, money, rate limits,
uploads, and the realtime chat gateway — is documented in
[api-conventions.md](api-conventions.md). System design and escrow flows are in
[architecture.md](architecture.md).

## Base URLs

| Environment | Base URL |
| --- | --- |
| Local | `http://localhost:3000` |
| Production | `https://skillshift-api.duckdns.org` |

The web app calls these routes through the same-origin Next.js proxy at `/api/backend/*`.

## Access levels

| Label | Meaning |
| --- | --- |
| Public | No access token required |
| Authenticated | Any signed-in user |
| Client / Freelancer | Role-restricted by `RolesGuard` |
| Owner | Role check plus ownership of the record, enforced in the service layer |
| Participant | The client or the freelancer on that order |
| Admin | Administrator only |

All routes require `Authorization: Bearer <accessToken>` unless marked Public. `POST /auth/refresh`
is public because it authenticates with the HttpOnly refresh cookie instead.

## Auth (9)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Create a client or freelancer account |
| GET | `/auth/verify-email` | Public | Verify an email address with the token from the email |
| POST | `/auth/resend-verification` | Public | Resend the verification email (rate limited) |
| POST | `/auth/login` | Public | Sign in; sets the refresh cookie and returns an access token |
| GET | `/auth/me` | Authenticated | Return the current JWT payload (`sub`, `email`, `role`) |
| POST | `/auth/refresh` | Public (cookie) | Rotate the refresh cookie and issue a new access token |
| POST | `/auth/logout` | Authenticated | Revoke the refresh token and clear the cookie |
| POST | `/auth/forgot-password` | Public | Email a password reset link (rate limited) |
| POST | `/auth/reset-password` | Public | Set a new password and revoke existing refresh tokens |

## Users (3)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/users/me` | Authenticated | Full profile of the current user |
| PATCH | `/users/me` | Authenticated | Update the current user's profile |
| GET | `/users/{id}` | Public | Public profile of a user |

## Services (6)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/services` | Freelancer | Create a service listing |
| GET | `/services` | Public | Browse active services with skill and price filters (cursor paginated) |
| GET | `/services/mine` | Freelancer | List the caller's own services in every status |
| GET | `/services/{id}` | Public | Service detail |
| PATCH | `/services/{id}` | Freelancer · owner | Update a service listing you own |
| DELETE | `/services/{id}` | Freelancer · owner | Soft-delete a service listing you own |

## Search (1)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/search/services` | Public | Search active services by text, skills, and price |

## Orders (6)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/orders` | Client | Create an order; the service price is held in escrow |
| GET | `/orders` | Authenticated | List the caller's orders as client or freelancer |
| GET | `/orders/{id}` | Participant | Order detail for a participant |
| PATCH | `/orders/{id}/deliver` | Freelancer · participant | Mark an order delivered with a delivery note |
| POST | `/orders/{id}/cancel` | Client · Freelancer · participant | Cancel an in-progress order; held escrow is refunded to the client |
| POST | `/orders/{id}/complete` | Client · owner | Approve delivery and release escrow to the freelancer |

## Wallet (4)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/wallet` | Authenticated | Current wallet balance |
| POST | `/wallet/deposit` | Authenticated | Add test funds to the wallet |
| POST | `/wallet/withdraw` | Client · Freelancer | Withdraw available balance (test mode) |
| GET | `/wallet/transactions` | Authenticated | Wallet transaction history |

## Reviews (2)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/reviews/services/{serviceId}` | Public | Reviews for a service |
| POST | `/reviews` | Client · owner | Review a completed order; one review per order |

## Disputes (1)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/disputes` | Client · owner | Open a dispute on a delivered order |

Admin dispute review lives under [Admin](#admin-8), following the `/admin/*` path prefix.

## Notifications (4)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/notifications` | Authenticated | List the caller's notifications |
| GET | `/notifications/unread-count` | Authenticated | Unread notification count |
| PATCH | `/notifications/{id}/read` | Authenticated | Mark one of the caller's notifications as read |
| POST | `/notifications/read-all` | Authenticated | Mark all of the caller's notifications as read |

## Chat (1)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/chat/{orderId}/messages` | Participant | Cursor-paginated messages for an order |

Live send and receive happens over the Socket.IO gateway on the `/chat` namespace; see
[api-conventions.md](api-conventions.md#realtime-chat).

## Upload (3)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/upload/presigned` | Authenticated | Get a presigned S3 URL for an avatar, service, portfolio, or delivery file |
| POST | `/upload/confirm` | Authenticated | Verify the uploaded object and persist its metadata |
| GET | `/upload/download-url` | Participant | Short-lived download URL for a delivery file on the caller's order |

Upload access is resource-scoped: avatars are tied to the caller's own profile, service and
portfolio files to the service owner, and delivery files to the freelancer on the order.

## Admin (8)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/analytics` | Admin | Platform metrics for the admin dashboard |
| GET | `/admin/users` | Admin | List users |
| GET | `/admin/services` | Admin | List services for moderation |
| GET | `/admin/orders` | Admin | List orders |
| PATCH | `/admin/users/{id}/{action}` | Admin | Enable or disable a user account (`enable` or `disable`) |
| PATCH | `/admin/services/{id}/moderate` | Admin | Approve or reject a service listing (`ACTIVE` or `REJECTED`) |
| GET | `/admin/disputes` | Admin | List disputes |
| PATCH | `/admin/disputes/{id}/resolve` | Admin | Resolve a dispute: refund the client or release escrow to the freelancer |

## App (1)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/` | Authenticated | API root check (returns a greeting) |

---

The live Swagger spec is the source of truth for this page: 44 paths and 49 operations. Update
this page alongside any controller change.
