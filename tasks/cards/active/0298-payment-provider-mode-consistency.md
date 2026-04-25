# Payment Provider Mode Consistency

Status: active

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

- [ ] payment provider mode annotations reuse shared posture mode where compatible
- [ ] payment summary branches use shared provider-mode predicates where practical
- [ ] payment response envelopes remain unchanged
- [ ] playbook records payment provider posture consistency guidance
- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
