# Core Mock Request Helper

Status: active

## Summary

Add shared core runtime helpers for mock JSON responses, request path resolution, and query coercion used by official host mock adapters.

## Ownership

- owned files: `packages/core/src/runtime/mock-request.ts`, `packages/core/src/runtime/index.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm test -- packages/core/src/runtime/*.test.ts`

## Acceptance

- [ ] mock request helpers are exported through `@minix/core`
- [ ] helpers stay data-only and platform-neutral
- [ ] docs note official mock adapter reuse
- [ ] `pnpm verify` run, or skipped with reason if docs-only
