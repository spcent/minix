# Payment Provider Mode Consistency

Status: done

## Summary

Align payment API provider-mode typing and predicates with the shared provider posture helper.

## Goal

Payment is a high-reuse product-matrix capability. Payment API code still has several local `"sample" | "production"` annotations and direct equality checks that should align with `ProviderPostureMode` and shared predicates.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: payment provider mode consistency

## Scope

- In scope:
  - replace payment-local provider mode unions where they match `ProviderPostureMode`
  - use `isSampleProviderMode` and `isProductionProviderMode` in payment domain summaries where practical
  - preserve payment contract types and response shapes
  - update the product-matrix reuse playbook
- Out of scope:
  - changing gateway semantics or callback verification
  - changing payment provider enum values
  - changing merchant configuration behavior

## Ownership

- owned files:
  - `apps/api/src/domains/payment/orders.ts`
  - `apps/api/src/domains/payment/ledger.ts`
  - `apps/api/src/domains/payment/after-sales.ts`
  - `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host files

## Dependencies

- depends on: `0290-api-provider-mode-type-consistency`
- blocked by: none
- integration notes: behavior-preserving provider-mode cleanup only.

## Affected Paths

- `apps/api/src/domains/payment/...`
- `docs/...`
- `tasks/cards/...`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`

## Interface Notes

- contract changes allowed: none
- store shape changes allowed: none
- controller action changes allowed: none
- route param changes allowed: none

## Verification

- slice gate: `pnpm verify:api`
- generation needed: no
- final verifier handoff: `pnpm verify`

## Acceptance

- [x] payment provider mode annotations reuse shared posture mode where compatible
- [x] payment summary branches use shared provider-mode predicates where practical
- [x] payment response envelopes remain unchanged
- [x] playbook records payment provider posture consistency guidance
- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced payment-local sample/production helper annotations in order summary builders with `PaymentProviderMode`.
- Replaced direct sample/production comparisons in owned payment domain files with shared provider posture predicates.
- Kept payment contracts, gateway behavior, callback verification, and response envelopes unchanged.
