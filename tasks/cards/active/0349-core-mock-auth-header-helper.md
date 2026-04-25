# Core Mock Auth Header Helper

Status: active

## Summary

Add core mock request helpers for Bearer authorization header construction and matching.

## Ownership

- owned files: `packages/core/src/runtime/mock-request.ts`, `packages/core/src/runtime/mock-request.test.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm test -- packages/core/src/runtime/*.test.ts`

## Acceptance

- [ ] mock auth header helper builds Bearer headers
- [ ] mock auth header helper matches Bearer headers
- [ ] helpers remain platform-neutral
- [ ] `pnpm verify` run, or skipped with reason if docs-only
