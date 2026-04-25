# API Provider Mode Type Consistency

## Summary

Normalize API provider-mode typing and common sample/production predicates so provider-backed domains avoid repeated literal unions and ad hoc comparisons.

## Goal

Future provider-backed product features should use one API-side provider-mode type and helper vocabulary when resolving sample vs production posture.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: API provider mode consistency

## Scope

- In scope:
  - add provider-mode predicate helpers to `apps/api/src/domains/provider-posture.ts`
  - migrate auth/settings/upload/share provider-mode helper signatures to `ProviderPostureMode`
  - replace repeated direct production/sample checks where touched by those helpers
  - update the product-matrix reuse playbook
- Out of scope:
  - changing payment commerce provider behavior
  - changing provider env names
  - changing response field names

## Ownership

- owned files:
  - `apps/api/src/domains/provider-posture.ts`
  - `apps/api/src/domains/auth/routes.ts`
  - `apps/api/src/domains/settings/state.ts`
  - `apps/api/src/domains/uploads/pipeline.ts`
  - `apps/api/src/domains/share/attribution.ts`
  - `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host files

## Dependencies

- depends on: `0288-provider-mode-helper-adoption`
- blocked by: none
- integration notes: keep this as a type/predicate consistency pass only.

## Affected Paths

- `apps/api/src/domains/...`
- `docs/...`
- `tasks/cards/...`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`

## Interface Notes

- contract changes allowed: none
- store shape changes allowed: none
- controller action changes allowed: none
- route param changes allowed: none

## Verification

- slice gate: `pnpm verify:api`
- generation needed: no
- final verifier handoff: `pnpm verify` after the last card in this batch

## Acceptance

- [ ] provider-mode helper exposes reusable production/sample predicates
- [ ] auth/settings/upload/share provider-mode functions use `ProviderPostureMode`
- [ ] response shapes and env names stay unchanged
- [ ] playbook records provider-mode typing and predicate reuse
- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
