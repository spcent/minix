# Subscription Payment Predicate Cleanup

Status: active

## Summary

Align subscription controller payment provider-mode branches with shared provider posture predicates.

## Goal

Subscription is the host-facing consumer of payment state. It should describe sample/production payment posture with the same predicate vocabulary as the API payment domain.

## Scope

- In scope:
  - replace direct sample provider-mode comparisons in subscription controller summaries
  - preserve subscription state, actions, and payment flow behavior
  - update the product-matrix reuse playbook
- Out of scope:
  - changing payment contracts
  - changing subscription purchase or after-sales workflows

## Ownership

- owned files:
  - `packages/features/subscription/src/controller/index.ts`
  - `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host files

## Verification

- slice gate: `pnpm verify:feature subscription`
- generation needed: no
- final verifier handoff: `pnpm verify`

## Acceptance

- [ ] subscription payment provider-mode branches use shared predicates
- [ ] public feature APIs and state fields remain unchanged
- [ ] playbook records subscription payment posture guidance
- [ ] change is local and reversible
- [ ] `pnpm verify` run, or skipped with reason if docs-only
