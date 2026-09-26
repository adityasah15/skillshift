### Phase 9 — Uploads

**Status:** Implemented + manually tested

Implemented:

* S3 presigned `PUT` URL generation
* S3 upload confirmation
* `HeadObject` verification
* Supported upload resources:

  * avatar
  * portfolio
  * service images
  * delivery files
* JWT authentication
* Resource ownership authorization
* Filename/key validation
* File type validation
* File size validation
* Service image persistence through `Service.imageUrls`
* Delivery file persistence through `DeliveryFile`

### Upload Testing

Manual testing successfully verified:

* Presigned URL generation
* S3 upload
* Upload confirmation
* Service ownership authorization
* Delivery ownership authorization
* Invalid file type rejection
* Files larger than 5 MB rejection
* `DeliveryFile` persistence
* Service upload persistence through `imageUrls`

### Database

Added and applied migration:

```text
20260926140735_add_delivery_file
```

The migration adds the `DeliveryFile` model and `Order.deliveryFiles` relation.

### Verification

* `npm run build` passed
* `npx prisma validate` passed
* Manual Postman/S3 testing passed

### Testing Scope

Automated Upload tests were **not run**.

They remain deferred to the project's automated testing/hardening work.

### Next

Continue with the next Blueprint phase after documentation and commit verification.
