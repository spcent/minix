# API Account Operations Snapshot Cleanup

Status: done

## Summary

Adopt API-domain snapshot helpers in account operation security projections.

## Ownership

- owned files: `apps/api/src/domains/account/operations.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] account operation security projections use API snapshot helpers
- [x] API response envelopes remain unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced account security center device, audit, prompt, and rate-limit clones with API-domain snapshot helpers.
- Kept account response envelopes unchanged.
