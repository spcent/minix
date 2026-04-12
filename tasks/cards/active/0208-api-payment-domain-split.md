# Card 0208 API Payment Domain Split

## Summary

Split payment catalog, orders, subscriptions, after-sales, and ledger helpers into dedicated modules.

## Goal

Remove payment route registration and payment business helpers from the giant API files without changing the current sample flow.

## Milestone

- milestone file: none
- slice name: `api payment domain split`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add `domains/payment/routes.ts`
  - add `domains/payment/schemas.ts`
  - add `domains/payment/catalog.ts`
  - add `domains/payment/orders.ts`
  - add `domains/payment/subscriptions.ts`
  - add `domains/payment/after-sales.ts`
  - add `domains/payment/ledger.ts`
  - move payment routes and helpers from `app.ts` and `data.ts`
- Out of scope:
  - changing gateway behavior or callback semantics

## Ownership

- owned files:
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - `apps/api/src/domains/payment/**`
  - `tasks/cards/active/0208-api-payment-domain-split.md`

## Dependencies

- depends on:
  - `0201-api-http-infra-extraction.md`
  - `0209-api-account-domain-split.md`
- blocked by:
  - none
- integration notes:
  - keep ledger helpers separate from route handling to avoid future callback coupling

## Affected Paths

- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- `apps/api/src/domains/payment/**`

## Verification

- slice gate:
  - payment routes and helpers are domain-scoped and API behavior stays stable
- generation needed:
  - none
- final verifier handoff:
  - include API verification command and touched payment endpoints

## Acceptance

- [x] payment routes are registered from `domains/payment/routes.ts`
- [x] payment schemas are moved out of `app.ts`
- [x] payment helper clusters are moved out of `data.ts`
- [x] `pnpm verify:api` run

## Notes

- `app.ts` now mounts payment HTTP behavior through `domains/payment/routes.ts` and no longer contains inline purchase, callback, reconciliation, order, subscription, or after-sales route blocks.
- `data.ts` now keeps only cross-domain seed and aggregate responsibilities; payment catalog, order creation, subscription listing, after-sales, and ledger operations live under `domains/payment/*`.
- 2026-04-12: `pnpm -s exec tsc -p tsconfig.json --noEmit`
- 2026-04-12: `pnpm verify:api`
