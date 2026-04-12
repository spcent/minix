# Card 0106 User Asset Ledger And Entitlement Ledger

## Summary

Turn user assets from summary placeholders into durable ledger-backed balances and entitlements.

## Goal

Implement points, level, membership, rights, balance, freezes, refunds, and entitlement consumption with auditable asset history.

## Milestone

- milestone file: none
- slice name: `user asset ledger and entitlement ledger`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add asset ledger contracts and account summary integration
  - persist points, level, membership, entitlement, and balance change records
  - support freeze, unfreeze, refund, consume, grant, revoke, and expiry states
  - connect payment/refund events to entitlement and balance updates
  - add asset history list and tests
- Out of scope:
  - external wallet provider integration unless required by payment provider

## Ownership

- owned files:
  - `packages/contracts/src/api/user.ts`
  - `packages/contracts/src/api/payment.ts`
  - `packages/features/account/src/**`
  - `packages/features/subscription/src/**`
  - `apps/api/src/app.ts`
  - `apps/api/src/store*.ts`
  - asset and entitlement tests
- allowed generated outputs:
  - regenerated manifests and shells only if pages change
- forbidden files:
  - generated host files as source edits

## Dependencies

- depends on:
  - `0100-payment-real-gateway-and-ledger-completion.md`
- blocked by:
  - product decision for balance currency and entitlement taxonomy
- integration notes:
  - ledger entries should be append-only and reference originating business events

## Affected Paths

- `packages/contracts/src/api/user.ts`
- `packages/contracts/src/api/payment.ts`
- `packages/features/account/src/controller/index.ts`
- `packages/features/subscription/src/controller/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`

## Interface Notes

- contract changes allowed:
  - yes, for ledger entries, entitlement state, balance state, and asset history responses
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for asset history filters

## Verification

- slice gate:
  - payment, refund, and entitlement changes are reflected in account assets with durable history
- generation needed:
  - none unless pages are added
- final verifier handoff:
  - verify ledger invariants and append-only behavior

## Acceptance

- [x] asset ledger is durable and append-only
- [x] membership and entitlement state derives from ledger events
- [x] refunds and cancellations update assets correctly
- [x] account summary exposes balance/points/rights without placeholder semantics
- [x] tests cover grant, consume, refund, freeze, and expiry
- [x] `pnpm verify` run
