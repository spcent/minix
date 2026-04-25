# Settings Section Item Snapshot Cleanup

Status: active

## Summary

Replace remaining settings section item shallow-copy helpers with core snapshot helpers.

## Ownership

- owned files: `packages/features/settings/src/controller/index.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:feature settings`

## Acceptance

- [ ] settings section merge/update snapshots use core helpers
- [ ] public state shape remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
