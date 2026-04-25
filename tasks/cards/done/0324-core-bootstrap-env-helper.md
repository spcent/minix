# Core Bootstrap Env Helper

Status: done

## Summary

Add shared core runtime helpers for host bootstrap boolean flags, process env reads, and H5 location query reads.

## Ownership

- owned files: `packages/core/src/runtime/bootstrap-env.ts`, `packages/core/src/runtime/index.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm test -- packages/core/src/runtime/*.test.ts`

## Acceptance

- [x] bootstrap env parsing helpers are exported through `@minix/core`
- [x] helpers do not call host-only APIs outside guarded global access
- [x] docs note official host bootstrap reuse
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added core bootstrap env helpers and focused runtime tests.
- Exported the helpers through `@minix/core` and documented official host bootstrap reuse.
