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

- [ ] payment callback and reconciliation visibility is clearer in shared state
- [ ] renewal, refund, and after-sales continuity remains normalized across hosts
- [ ] idempotency and ledger-audit posture is clearer without breaking current outputs
- [ ] no host-local commerce fork is introduced
- [ ] `pnpm verify` run, or skipped with reason if docs-only
