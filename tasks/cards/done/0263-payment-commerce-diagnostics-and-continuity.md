# Card 0263 Payment Commerce Diagnostics And Continuity

## Summary

Improve order, payment, renewal, refund, and after-sales continuity with stronger diagnostics and clearer shared commerce state.

## Goal

Make commerce flows easier to reason about across generic and novel hosts without changing the canonical payment envelope.

## Milestone

- milestone file: none
- slice name: `payment commerce diagnostics and continuity`

## Priority

- priority: `P2`

## Scope

- In scope:
  - richer callback and reconciliation diagnostics in shared order detail
  - stronger renewal, cancellation, refund, and after-sales continuity for subscription products
  - clearer idempotency, duplicate-payment, and ledger-audit visibility
  - explicit commerce capability posture for native pay, H5 redirect, and degraded follow-up
- Out of scope:
  - a second order-center stack
  - merchant-specific business logic in host apps

## Ownership

- owned files:
  - `docs/ROADMAP.md`
  - `docs/BACKEND_CONTRACT.md`
  - `packages/contracts/src/api/payment.ts`
  - `packages/contracts/src/api/membership.ts`
  - `packages/features/subscription`
  - `apps/api/src/domains/payment`
- allowed generated outputs:
  - none
- forbidden files:
  - host-local payment-result wrappers

## Dependencies

- depends on:
  - `tasks/cards/active/0243-payment-merchant-rollout-and-callback-ops.md`
  - `tasks/cards/done/0258-host-capability-experience-hardening.md`
- blocked by:
  - final release closure for the current `P0` queue
- integration notes:
  - keep `order`, `paymentIntent`, `paymentResult`, and `entitlement` as the canonical commerce outputs

## Affected Paths

- `docs/ROADMAP.md`
- `docs/BACKEND_CONTRACT.md`
- `packages/contracts/src/api/payment.ts`
- `packages/contracts/src/api/membership.ts`
- `packages/features/subscription`
- `apps/api/src/domains/payment`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Interface Notes

- contract changes allowed:
  - yes, additive-only inside the canonical commerce outputs
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - none

## Verification

- slice gate:
  - commerce continuity and diagnostics improve without creating a second payment surface
- generation needed:
  - none
- final verifier handoff:
  - include diagnostics additions, continuity rules, and capability posture changes

## Acceptance

- [x] payment callback and reconciliation visibility is clearer in shared state
- [x] renewal, refund, and after-sales continuity remains normalized across hosts
- [x] idempotency and ledger-audit posture is clearer without breaking current outputs
- [x] no host-local commerce fork is introduced
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added additive diagnostics and continuity fields to `packages/contracts/src/api/payment.ts` so the canonical commerce outputs can now express callback diagnostics, reconciliation diagnostics, idempotency posture, ledger-audit summaries, and after-sales continuity without creating a second payment surface.
- Extended `apps/api/src/domains/payment/orders.ts`, `apps/api/src/domains/payment/ledger.ts`, `apps/api/src/domains/payment/after-sales.ts`, and `apps/api/src/domains/payment/routes.callbacks.ts` so purchase, callback, reconciliation, cancellation, refund, and after-sales flows all emit the same shared commerce summaries.
- Updated `packages/features/subscription/src/model/index.ts` and `packages/features/subscription/src/controller/index.ts` so subscription state keeps normalized payment continuity and diagnostics summaries instead of forcing hosts to infer them from raw callback or ledger fields.
- Synced `docs/BACKEND_CONTRACT.md` and `docs/ROADMAP.md` to reflect the stronger shared commerce diagnostics baseline.

## Verification Notes

- `node --import tsx --test packages/features/subscription/src/controller/index.test.ts`
- `node --import tsx --test apps/api/src/app.test.ts`
- `pnpm verify`
