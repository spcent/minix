# API Content Managed Snapshot Cleanup

Status: done

## Summary

Adopt API-domain snapshot helpers in managed content authoring and card projections.

## Ownership

- owned files: `apps/api/src/domains/content/managed-content.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] managed content authoring/card projections use API snapshot helpers
- [x] content response envelopes remain unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced managed content review, audit, authoring, tag, and topic clones with API-domain snapshot helpers.
- Kept content response envelopes unchanged.
