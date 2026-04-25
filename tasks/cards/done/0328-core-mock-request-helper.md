# Core Mock Request Helper

Status: done

## Summary

Add shared core runtime helpers for mock JSON responses, request path resolution, and query coercion used by official host mock adapters.

## Ownership

- owned files: `packages/core/src/runtime/mock-request.ts`, `packages/core/src/runtime/index.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm test -- packages/core/src/runtime/*.test.ts`

## Acceptance

- [x] mock request helpers are exported through `@minix/core`
- [x] helpers stay data-only and platform-neutral
- [x] docs note official mock adapter reuse
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added core mock request helpers and focused runtime tests.
- Exported the helpers through `@minix/core` and documented official mock adapter reuse.
