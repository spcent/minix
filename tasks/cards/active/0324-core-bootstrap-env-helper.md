# Core Bootstrap Env Helper

Status: active

## Summary

Add shared core runtime helpers for host bootstrap boolean flags, process env reads, and H5 location query reads.

## Ownership

- owned files: `packages/core/src/runtime/bootstrap-env.ts`, `packages/core/src/runtime/index.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm test -- packages/core/src/runtime/*.test.ts`

## Acceptance

- [ ] bootstrap env parsing helpers are exported through `@minix/core`
- [ ] helpers do not call host-only APIs outside guarded global access
- [ ] docs note official host bootstrap reuse
- [ ] `pnpm verify` run, or skipped with reason if docs-only
