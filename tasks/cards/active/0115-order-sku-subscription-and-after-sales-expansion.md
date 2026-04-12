# Card 0115 Order SKU Subscription And After Sales Expansion

## Summary

Expand payment domain beyond membership purchase into general order, SKU, subscription, virtual entitlement, and after-sales workflows.

## Goal

Support one-time goods, subscription products, membership packages, value-added services, order lists, order detail, cancellation, refund, and after-sales entry points.

## Milestone

- milestone file: none
- slice name: `order sku subscription and after sales expansion`

## Priority

- priority: `P2`

## Scope

- In scope:
  - add product/SKU contracts for one-time goods, subscription goods, membership packages, virtual rights, and value-added services
  - add order list and after-sales list/detail workflows
  - support subscription renewal, cancellation, expiry, and grace state
  - connect entitlement ledger updates to SKU fulfillment
  - add tests for order list, SKU selection, subscription lifecycle, and after-sales state
- Out of scope:
  - payment gateway hardening, covered by `0100`

## Ownership

- owned files:
  - `packages/contracts/src/api/payment.ts`
  - `packages/features/subscription/src/**`
  - optional order feature package under `packages/features/*`
  - `apps/api/src/app.ts`
  - `apps/api/src/store*.ts`
  - host manifest page definitions if new pages are introduced
- allowed generated outputs:
  - regenerated manifests and shells only if pages change
- forbidden files:
  - generated host files as source edits

## Dependencies

- depends on:
  - `0100-payment-real-gateway-and-ledger-completion.md`
  - `0106-user-asset-ledger-and-entitlement-ledger.md`
- blocked by:
  - product catalog taxonomy and fulfillment rules
- integration notes:
  - keep membership purchase as one SKU family, not a special-case-only payment domain

## Affected Paths

- `packages/contracts/src/api/payment.ts`
- `packages/features/subscription/src/controller/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for SKU, product, subscription, fulfillment, and after-sales records
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for order id, SKU id, and after-sales id

## Verification

- slice gate:
  - at least membership, one-time virtual good, and subscription product lifecycles are represented
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat pages change
- final verifier handoff:
  - include SKU-to-entitlement fulfillment matrix

## Acceptance

- [x] product/SKU model supports required product types
- [x] order list and order detail are implemented
- [x] subscription lifecycle is implemented
- [x] after-sales/refund/cancel entry points are implemented
- [x] SKU fulfillment updates entitlement ledger
- [x] `pnpm verify` run
