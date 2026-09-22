### Supplemental Feature — Reviews/Ratings

**Status:** Implemented + manually tested

Reviews/Ratings was implemented as a supplemental Blueprint-gap feature. It is **not a numbered Blueprint phase**.

Implemented:

* Client reviews freelancer
* `POST /reviews`
* One review per Order
* Completed-order requirement
* Duplicate-review protection
* Rating validation from 1–5
* Freelancer Profile rating update
* Freelancer `totalReviews` update
* `REVIEW_RECEIVED` notification
* Review/Profile updates handled transactionally

The Review direction is:

```text
Client
  ↓ reviews
Freelancer
```

`reviewerId`, `revieweeId`, and `serviceId` are derived server-side rather than supplied by the client.

The existing Prisma constraint remains:

```text
Review.orderId @unique
```

Therefore, the implementation maintains one Review per Order.

### Reviews/Ratings Testing

Manually verified:

* Valid review on a `COMPLETED` Order
* Duplicate review rejection
* Rating `0` rejection
* Rating `6` rejection
* Non-integer rating rejection
* Freelancer attempting to review rejection
* Review on an `IN_PROGRESS` Order rejection
* Review persistence
* Freelancer Profile rating update
* Freelancer `totalReviews` update
* `REVIEW_RECEIVED` notification creation

For the successful review:

```text
Review.rating = 5
Profile.rating = 5
Profile.totalReviews = 1
Notification.type = REVIEW_RECEIVED
Notification recipient = reviewed freelancer
```

Not separately verified in this manual pass:

* Non-existent Order
* Invalid comment type
* Optional comment omission
* Second-review aggregation
* Automated tests

These remain candidates for the dedicated automated-testing/hardening phase.

### Official Phase Sequence

Reviews/Ratings does **not** change the official phase numbering.

```text
Phase 7 — Disputes
        ↓
Supplemental Reviews/Ratings
        ↓
Phase 8 — Chat
```

**Next official phase:** Phase 8 — Chat
