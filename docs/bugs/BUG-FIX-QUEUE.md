# SpaceFly.ai — Bug Fix Queue

78 fix units derived from 132 audited bugs in [`BUGS.md`](BUGS.md). Co-located bugs (same file) are grouped into a single unit/PR. Sorted by max severity, then by group size desc.

| # | Status | Max Sev | Bugs | File / Scope | Branch |
|---:|---|---|---|---|---|
| 1 | ⏳ pending | critical | ADMIN-001, ADMIN-017 | `apps/admin/src/stores/authStore.ts` | `fix/unit-001-apps-admin-src-stores-authstore-ts` |
| 2 | ⏳ pending | critical | DB-001 | `_nofile_DB-001` | `fix/unit-002-db-001` |
| 3 | ⏳ pending | high | BOOKSVC-001, BOOKSVC-002, BOOKSVC-003, BOOKSVC-004, BOOKSVC-005, BO... | `apps/order-service/src/routes/booking.ts` | `fix/unit-003-apps-order-service-src-routes-booking-ts` |
| 4 | ⏳ pending | high | PRODSVC-001, PRODSVC-002, PRODSVC-009, PRODSVC-010, PRODSVC-013, PR... | `apps/product-service/src/controllers/space.controller.ts` | `fix/unit-004-apps-product-service-src-controllers-space-controller-ts` |
| 5 | ⏳ pending | high | AUTHSVC-002, AUTHSVC-003, AUTHSVC-004, AUTHSVC-005, AUTHSVC-006, AU... | `apps/auth-service/src/routes/auth.route.ts` | `fix/unit-005-apps-auth-service-src-routes-auth-route-ts` |
| 6 | ⏳ pending | high | EMAIL-001, EMAIL-002, EMAIL-006, EMAIL-008 | `apps/email-service/src/index.ts` | `fix/unit-006-apps-email-service-src-index-ts` |
| 7 | ⏳ pending | high | DB-002, DB-003, DB-005, DB-007 | `packages/db/prisma/schema.prisma` | `fix/unit-007-packages-db-prisma-schema-prisma` |
| 8 | ⏳ pending | high | PRODSVC-005, PRODSVC-011 | `apps/product-service/src/controllers/review.controller.ts` | `fix/unit-008-apps-product-service-src-controllers-review-controller-ts` |
| 9 | ⏳ pending | high | KAFKA-001, KAFKA-002 | `packages/kafka/src/producer.ts` | `fix/unit-009-packages-kafka-src-producer-ts` |
| 10 | ⏳ pending | high | CLIENT-001 | `_nofile_CLIENT-001` | `fix/unit-010-client-001` |
| 11 | ⏳ pending | high | CLIENT-002 | `apps/client/src/app/[locale]/(main)/bookings/page.tsx` | `fix/unit-011-apps-client-src-app-locale-main-bookings-page-tsx` |
| 12 | ⏳ pending | high | CLIENT-003 | `apps/client/src/components/HostFilter.tsx` | `fix/unit-012-apps-client-src-components-hostfilter-tsx` |
| 13 | ⏳ pending | high | ADMIN-002 | `apps/admin/src/app/(dashboard)/admin/users/data-table.tsx` | `fix/unit-013-apps-admin-src-app-dashboard-admin-users-data-table-tsx` |
| 14 | ⏳ pending | high | ADMIN-003 | `apps/admin/src/middleware.ts` | `fix/unit-014-apps-admin-src-middleware-ts` |
| 15 | ⏳ pending | high | ADMIN-004 | `apps/admin/src/lib/auth.ts` | `fix/unit-015-apps-admin-src-lib-auth-ts` |
| 16 | ⏳ pending | high | ADMIN-005 | `apps/admin/src/components/EditUser.tsx` | `fix/unit-016-apps-admin-src-components-edituser-tsx` |
| 17 | ⏳ pending | high | PRODSVC-003 | `_nofile_PRODSVC-003` | `fix/unit-017-prodsvc-003` |
| 18 | ⏳ pending | high | PRODSVC-004 | `_nofile_PRODSVC-004` | `fix/unit-018-prodsvc-004` |
| 19 | ⏳ pending | high | AUTHSVC-001 | `_nofile_AUTHSVC-001` | `fix/unit-019-authsvc-001` |
| 20 | ⏳ pending | high | AUTHMW-003 | `_nofile_AUTHMW-003` | `fix/unit-020-authmw-003` |
| 21 | ⏳ pending | high | DB-004 | `_nofile_DB-004` | `fix/unit-021-db-004` |
| 22 | ⏳ pending | high | DB-011 | `packages/db/prisma/seed.ts` | `fix/unit-022-packages-db-prisma-seed-ts` |
| 23 | ⏳ pending | medium | AUTHMW-001, AUTHMW-002, AUTHMW-006, AUTHMW-008 | `packages/auth-middleware/src/jwt.ts` | `fix/unit-023-packages-auth-middleware-src-jwt-ts` |
| 24 | ⏳ pending | medium | AUTHSVC-012, AUTHSVC-013, AUTHSVC-014 | `apps/auth-service/src/routes/user.route.ts` | `fix/unit-024-apps-auth-service-src-routes-user-route-ts` |
| 25 | ⏳ pending | medium | KAFKA-004, KAFKA-005, KAFKA-006 | `packages/kafka/src/client.ts` | `fix/unit-025-packages-kafka-src-client-ts` |
| 26 | ⏳ pending | medium | CLIENT-004, CLIENT-014 | `apps/client/src/app/[locale]/(main)/spaces/[id]/BookingForm.tsx` | `fix/unit-026-apps-client-src-app-locale-main-spaces-id-bookingform-tsx` |
| 27 | ⏳ pending | medium | CLIENT-018, CLIENT-020 | `apps/client/src/lib/apiClient.ts` | `fix/unit-027-apps-client-src-lib-apiclient-ts` |
| 28 | ⏳ pending | medium | PRODSVC-007, PRODSVC-020 | `apps/product-service/src/index.ts` | `fix/unit-028-apps-product-service-src-index-ts` |
| 29 | ⏳ pending | medium | EMAIL-005, EMAIL-007 | `apps/email-service/src/utils/mailer.ts` | `fix/unit-029-apps-email-service-src-utils-mailer-ts` |
| 30 | ⏳ pending | medium | AUTHMW-004, AUTHMW-005 | `packages/auth-middleware/src/password.ts` | `fix/unit-030-packages-auth-middleware-src-password-ts` |
| 31 | ⏳ pending | medium | CLIENT-005 | `apps/client/src/components/FeaturedSpaceCard.tsx` | `fix/unit-031-apps-client-src-components-featuredspacecard-tsx` |
| 32 | ⏳ pending | medium | CLIENT-006 | `_nofile_CLIENT-006` | `fix/unit-032-client-006` |
| 33 | ⏳ pending | medium | CLIENT-008 | `apps/client/src/lib/auth.ts` | `fix/unit-033-apps-client-src-lib-auth-ts` |
| 34 | ⏳ pending | medium | CLIENT-009 | `apps/client/src/lib/booking-pricing.ts` | `fix/unit-034-apps-client-src-lib-booking-pricing-ts` |
| 35 | ⏳ pending | medium | CLIENT-016 | `apps/client/src/app/[locale]/(main)/bookings/checkout/page.tsx` | `fix/unit-035-apps-client-src-app-locale-main-bookings-checkout-page-tsx` |
| 36 | ⏳ pending | medium | ADMIN-006 | `apps/admin/src/components/AddBooking.tsx` | `fix/unit-036-apps-admin-src-components-addbooking-tsx` |
| 37 | ⏳ pending | medium | ADMIN-007 | `apps/admin/src/components/AddUser.tsx` | `fix/unit-037-apps-admin-src-components-adduser-tsx` |
| 38 | ⏳ pending | medium | ADMIN-008 | `_nofile_ADMIN-008` | `fix/unit-038-admin-008` |
| 39 | ⏳ pending | medium | ADMIN-009 | `apps/admin/src/app/(dashboard)/admin/spaces/page.tsx` | `fix/unit-039-apps-admin-src-app-dashboard-admin-spaces-page-tsx` |
| 40 | ⏳ pending | medium | ADMIN-010 | `apps/admin/src/components/providers/QueryProvider.tsx` | `fix/unit-040-apps-admin-src-components-providers-queryprovider-tsx` |
| 41 | ⏳ pending | medium | ADMIN-011 | `_nofile_ADMIN-011` | `fix/unit-041-admin-011` |
| 42 | ⏳ pending | medium | ADMIN-012 | `_nofile_ADMIN-012` | `fix/unit-042-admin-012` |
| 43 | ⏳ pending | medium | ADMIN-013 | `apps/admin/src/app/(dashboard)/host/venues/page.tsx` | `fix/unit-043-apps-admin-src-app-dashboard-host-venues-page-tsx` |
| 44 | ⏳ pending | medium | ADMIN-014 | `apps/admin/src/app/(dashboard)/admin/exchange-rates/page.tsx` | `fix/unit-044-apps-admin-src-app-dashboard-admin-exchange-rates-page-tsx` |
| 45 | ⏳ pending | medium | ADMIN-015 | `apps/admin/src/app/(dashboard)/admin/bookings/page.tsx` | `fix/unit-045-apps-admin-src-app-dashboard-admin-bookings-page-tsx` |
| 46 | ⏳ pending | medium | ADMIN-016 | `apps/admin/src/components/spaces/space-form.shared.ts` | `fix/unit-046-apps-admin-src-components-spaces-space-form-shared-ts` |
| 47 | ⏳ pending | medium | PRODSVC-006 | `apps/product-service/src/controllers/currency.controller.ts` | `fix/unit-047-apps-product-service-src-controllers-currency-controller-ts` |
| 48 | ⏳ pending | medium | PRODSVC-008 | `_nofile_PRODSVC-008` | `fix/unit-048-prodsvc-008` |
| 49 | ⏳ pending | medium | AUTHSVC-008 | `_nofile_AUTHSVC-008` | `fix/unit-049-authsvc-008` |
| 50 | ⏳ pending | medium | EMAIL-003 | `_nofile_EMAIL-003` | `fix/unit-050-email-003` |
| 51 | ⏳ pending | medium | EMAIL-004 | `_nofile_EMAIL-004` | `fix/unit-051-email-004` |
| 52 | ⏳ pending | medium | KAFKA-003 | `packages/kafka/src/consumer.ts` | `fix/unit-052-packages-kafka-src-consumer-ts` |
| 53 | ⏳ pending | medium | TYPES-001 | `_nofile_TYPES-001` | `fix/unit-053-types-001` |
| 54 | ⏳ pending | medium | TYPES-003 | `_nofile_TYPES-003` | `fix/unit-054-types-003` |
| 55 | ⏳ pending | medium | DB-006 | `_nofile_DB-006` | `fix/unit-055-db-006` |
| 56 | ⏳ pending | medium | DB-008 | `_nofile_DB-008` | `fix/unit-056-db-008` |
| 57 | ⏳ pending | medium | DB-009 | `_nofile_DB-009` | `fix/unit-057-db-009` |
| 58 | ⏳ pending | medium | DB-010 | `_nofile_DB-010` | `fix/unit-058-db-010` |
| 59 | ⏳ pending | medium | DB-012 | `packages/db/src/client.ts` | `fix/unit-059-packages-db-src-client-ts` |
| 60 | ⏳ pending | low | ADMIN-019, ADMIN-021 | `apps/admin/src/app/(dashboard)/host/bookings/page.tsx` | `fix/unit-060-apps-admin-src-app-dashboard-host-bookings-page-tsx` |
| 61 | ⏳ pending | low | CLIENT-007 | `_nofile_CLIENT-007` | `fix/unit-061-client-007` |
| 62 | ⏳ pending | low | CLIENT-010 | `apps/client/src/components/SpaceMapPin.tsx` | `fix/unit-062-apps-client-src-components-spacemappin-tsx` |
| 63 | ⏳ pending | low | CLIENT-011 | `apps/client/src/components/Lightbox.tsx` | `fix/unit-063-apps-client-src-components-lightbox-tsx` |
| 64 | ⏳ pending | low | CLIENT-012 | `_nofile_CLIENT-012` | `fix/unit-064-client-012` |
| 65 | ⏳ pending | low | CLIENT-013 | `_nofile_CLIENT-013` | `fix/unit-065-client-013` |
| 66 | ⏳ pending | low | CLIENT-015 | `_nofile_CLIENT-015` | `fix/unit-066-client-015` |
| 67 | ⏳ pending | low | CLIENT-019 | `apps/client/src/components/SpaceListBrowse.tsx` | `fix/unit-067-apps-client-src-components-spacelistbrowse-tsx` |
| 68 | ⏳ pending | low | CLIENT-021 | `apps/client/src/app/[locale]/(main)/spaces/[id]/LocationMap.tsx` | `fix/unit-068-apps-client-src-app-locale-main-spaces-id-locationmap-tsx` |
| 69 | ⏳ pending | low | CLIENT-022 | `apps/client/src/components/ImageGallery.tsx` | `fix/unit-069-apps-client-src-components-imagegallery-tsx` |
| 70 | ⏳ pending | low | ADMIN-018 | `apps/admin/src/app/(auth)/login/page.tsx` | `fix/unit-070-apps-admin-src-app-auth-login-page-tsx` |
| 71 | ⏳ pending | low | ADMIN-020 | `apps/admin/src/app/(dashboard)/admin/categories/page.tsx` | `fix/unit-071-apps-admin-src-app-dashboard-admin-categories-page-tsx` |
| 72 | ⏳ pending | low | ADMIN-022 | `apps/admin/src/app/(dashboard)/admin/amenities/page.tsx` | `fix/unit-072-apps-admin-src-app-dashboard-admin-amenities-page-tsx` |
| 73 | ⏳ pending | low | PRODSVC-012 | `_nofile_PRODSVC-012` | `fix/unit-073-prodsvc-012` |
| 74 | ⏳ pending | low | PRODSVC-015 | `apps/product-service/src/controllers/venue.controller.ts` | `fix/unit-074-apps-product-service-src-controllers-venue-controller-ts` |
| 75 | ⏳ pending | low | BOOKSVC-015 | `_nofile_BOOKSVC-015` | `fix/unit-075-booksvc-015` |
| 76 | ⏳ pending | low | TYPES-002 | `packages/types/src/booking.ts` | `fix/unit-076-packages-types-src-booking-ts` |
| 77 | ⏳ pending | low | TYPES-004 | `_nofile_TYPES-004` | `fix/unit-077-types-004` |
| 78 | ⏳ pending | low | AUTHMW-007 | `packages/auth-middleware/src/fastify.ts` | `fix/unit-078-packages-auth-middleware-src-fastify-ts` |

## Status legend
- ⏳ pending — not yet dispatched
- 🔧 in-flight — agent working in worktree
- ✅ committed — branch committed in worktree, ready for review/merge
- ❌ blocked — agent reported BLOCKED status; needs human attention
- 🔍 reviewed — passed spec + quality review
