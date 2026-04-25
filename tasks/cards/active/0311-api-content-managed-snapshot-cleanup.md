# API Content Managed Snapshot Cleanup

Status: active

## Summary

Adopt API-domain snapshot helpers in managed content authoring and card projections.

## Ownership

- owned files: `apps/api/src/domains/content/managed-content.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] managed content authoring/card projections use API snapshot helpers
- [ ] content response envelopes remain unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
