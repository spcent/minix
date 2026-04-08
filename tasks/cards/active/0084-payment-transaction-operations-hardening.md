# Card 0084 Payment Transaction Operations Hardening

## Summary

Upgrade the current sample order flow into a fuller transaction surface covering cancel, refund, callback verification, and operational reconciliation.

## Goal

Make payment safe enough for broader business flows instead of stopping at order creation, success polling, and idempotent membership purchase.

## Milestone

- milestone file: none
- slice name: `payment transaction operations hardening`

## Priority

- priority: `P0`

## Scope

- In scope:
  - add cancel and refund operations to the shared payment domain
  - model callback verification and reconciliation more explicitly in contracts and sample API behavior
  - harden polling, retry, duplicate protection, and failure/cancel result handling
  - support multi-step order transitions beyond the happy path
  - align subscription purchase and later purchase flows with the richer transaction state machine
  - keep actual gateway execution behind capability adapters
- Out of scope:
  - real settlement, invoicing, taxation, and finance back-office systems
  - production gateway signing implementations

## Ownership

- owned files:
  - `packages/contracts/src/api/payment.ts`
  - `packages/contracts/src/api/membership.ts`
  - `packages/features/subscription/src/**`
  - optional new payment feature package under `packages/features/*`
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - `apps/api/src/state.ts`
  - affected tests
- allowed generated outputs:
  - generated manifests and shells if host-visible pages change
- forbidden files:
  - direct platform payment execution from shared code

## Dependencies

- depends on:
  - `0074-payment-order-foundation.md`
- blocked by:
  - none
- integration notes:
  - preserve existing order-based abstractions; harden them rather than replacing them with a second payment model

## Affected Paths

- `packages/contracts/src/api/payment.ts`
- `packages/contracts/src/api/membership.ts`
- `packages/features/subscription/src/model/index.ts`
- `packages/features/subscription/src/controller/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- `apps/api/src/state.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`

## Interface Notes

- contract changes allowed:
  - yes, for refund/cancel/reconciliation/callback state refinement
- store shape changes allowed:
  - yes, in payment-oriented feature state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for result-page and return-target semantics

## Verification

- slice gate:
  - payment domain covers paid, failed, cancelled, refunded, and reconciled states without regressing current purchase flows
- generation needed:
  - run generation only if host source manifests change
- final verifier handoff:
  - record which transaction operations are fully sample-backed versus adapter-reserved

## Acceptance

- [ ] cancel and refund operations exist in shared contracts and sample workflows
- [ ] callback verification and reconciliation semantics are explicit
- [ ] failure, cancel, and recovery paths are first-class, not only success polling
- [ ] subscription purchase consumes the hardened transaction state machine
- [ ] `pnpm verify` run
