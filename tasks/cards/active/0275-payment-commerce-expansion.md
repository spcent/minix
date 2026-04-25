# Card 0275 Payment Commerce Expansion

## Summary

Expand payment gateway diagnostics, after-sales states, reconciliation reports, and merchant readiness through existing payment contracts.

## Goal

Make orders, payment intents, results, entitlements, subscriptions, refunds, and reconciliation more operable without storing live merchant secrets.

## Milestone

- milestone file: none
- slice name: `payment commerce expansion`

## Priority

- priority: `P2`

## Scope

- In scope:
  - gateway adapter metadata and diagnostics
  - after-sales state expansion for cancel, refund, and rejection paths
  - reconciliation reports and ledger summaries
  - idempotency and duplicate-payment evidence fields
- Out of scope:
  - committed merchant credentials
  - new payment route families
  - bypassing callback verification

## Ownership

- owned files:
  - `packages/contracts/src/api/payment.ts`
  - `packages/features/subscription`
  - `apps/api/src/domains/payment`
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- allowed generated outputs:
  - regenerated host manifests or shells only if source manifests change
- forbidden files:
  - merchant credentials, callback secrets, generated output edits by hand

## Dependencies

- depends on:
  - `tasks/cards/active/0243-payment-merchant-rollout-and-callback-ops.md`
  - `tasks/cards/done/0263-payment-commerce-diagnostics-and-continuity.md`
- blocked by:
  - live merchant rollout when provider-specific diagnostics are required
- integration notes:
  - keep shared outputs as `order`, `paymentIntent`, `paymentResult`, and `entitlement`

## Affected Paths

- `packages/contracts/src/api/payment.ts`
- `packages/features/subscription`
- `apps/api/src/domains/payment`
- `apps/*/src/manifest/page-definitions.ts`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - additive-only
- store shape changes allowed:
  - additive-only in subscription and order-centered state
- controller action changes allowed:
  - yes, within existing commerce actions
- route param changes allowed:
  - additive-only within existing payment routes

## Verification

- slice gate:
  - `pnpm verify:feature subscription`
- generation needed:
  - none unless host manifests change
- final verifier handoff:
  - include purchase, result query, callback, cancel, refund, reconciliation, and entitlement examples

## Acceptance

- [ ] commerce expansion keeps existing payment envelopes canonical
- [ ] callback verification remains required for production mode
- [ ] merchant secrets stay outside tracked source
- [ ] order continuity and duplicate protection remain visible
- [ ] docs updated for provider or workflow changes
- [ ] `pnpm verify` run, or skipped with reason if docs-only
