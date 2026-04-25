# API Account Operations Snapshot Cleanup

Status: active

## Summary

Adopt API-domain snapshot helpers in account operation security projections.

## Ownership

- owned files: `apps/api/src/domains/account/operations.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] account operation security projections use API snapshot helpers
- [ ] API response envelopes remain unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
