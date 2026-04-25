# Ops Provider Readiness Mode Helper Cleanup

Status: done

## Summary

Route ops provider readiness sample/production decisions through the shared provider posture helper.

## Goal

Operational readiness is the release-facing view of provider posture. It should use the same mode resolver and predicates as domain code.

## Scope

- In scope:
  - replace local env mode ternaries with `resolveProviderPostureMode`
  - replace sample/production readiness branches with shared predicates where practical
  - preserve readiness statuses, details, and evidence packs
  - update the product-matrix reuse playbook
- Out of scope:
  - changing provider readiness thresholds
  - changing ops routes or persisted job behavior

## Ownership

- owned files:
  - `apps/api/src/domains/ops/provider-readiness.ts`
  - `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host files

## Verification

- slice gate: `pnpm verify:api`
- generation needed: no
- final verifier handoff: `pnpm verify`

## Acceptance

- [x] ops readiness mode resolution uses shared helper
- [x] ops readiness branches use shared predicates where practical
- [x] readiness response shape remains unchanged
- [x] playbook records ops readiness posture guidance
- [x] change is local and reversible
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced local provider mode env ternaries with `resolveProviderPostureMode`.
- Replaced readiness sample/production branches with shared provider posture predicates.
- Kept readiness statuses, details, and evidence pack shape unchanged.
