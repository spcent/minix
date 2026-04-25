# API Domain Snapshot Helper Adoption

Status: done

## Summary

Add a small API-domain snapshot helper and adopt it in representative backend workflow state clones.

## Goal

API domains should have the same lightweight snapshot vocabulary as shared feature code, without adding a new package dependency from `apps/api` to `@minix/core`.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: API domain snapshot helper adoption

## Scope

- In scope:
  - add `apps/api/src/domains/snapshot.ts`
  - migrate representative API clones in ops, content lifecycle, payment callback/ledger, and share attribution
  - update the product-matrix reuse playbook
- Out of scope:
  - importing `@minix/core` into `apps/api`
  - broad rewrites of every API `structuredClone` call
  - changing API response shapes

## Ownership

- owned files:
  - `apps/api/src/domains/snapshot.ts`
  - `apps/api/src/domains/ops/jobs.ts`
  - `apps/api/src/domains/content/managed-content.ts`
  - `apps/api/src/domains/payment/ledger.ts`
  - `apps/api/src/domains/payment/routes.callbacks.ts`
  - `apps/api/src/domains/share/attribution.ts`
  - `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host files

## Dependencies

- depends on: `0290-api-provider-mode-type-consistency`
- blocked by: none
- integration notes: helper must remain local to API domain code and data-only.

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

- [x] API domain snapshot helper exists and stays dependency-local
- [x] ops/content/payment/share representative clones use the helper
- [x] API response shapes remain unchanged
- [x] playbook records API snapshot helper guidance
- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added `apps/api/src/domains/snapshot.ts` with API-local snapshot helpers.
- Migrated representative ops, content lifecycle, payment callback/ledger, and share attribution clones to the helper.
- Kept API response shapes unchanged.
