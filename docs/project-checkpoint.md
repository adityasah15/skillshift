### Phase 11 — Admin

**Status:** Implemented + manually tested

Implemented:

* `AdminModule`
* `AdminController`
* `AdminService`
* Admin-only route protection using `@Roles(Role.ADMIN)`
* Admin analytics
* Analytics Redis caching
* User enable/disable through soft deletion
* Service moderation

### Admin Endpoints

```text
GET   /admin/analytics
PATCH /admin/users/:id/disable
PATCH /admin/users/:id/enable
PATCH /admin/services/:id/moderate
```

### Analytics

Implemented analytics include:

* Total orders by status
* Released escrow revenue
* Top freelancers by rating
* Dispute rate
* New users per day for the last 30 days

Analytics are cached using:

```text
admin:analytics:dashboard
```

with a 60-second TTL.

### Manual Testing

Verified successfully:

* Non-admin access to admin routes → `403 Forbidden`
* Admin analytics → `200 OK`
* Disable user → `deletedAt` populated
* Enable user → `deletedAt` restored to `null`
* Service moderation → `REJECTED`
* Moderated test service restored to `ACTIVE`

Disposable test users/services were used and test fixtures were restored after testing.

### Database

No new schema changes were introduced.

### Automated Testing

Automated tests were skipped for this phase, consistent with the testing approach used for previous phases.

### Next

Continue to **Phase 12** according to the Blueprint.
