# Core Mock Pagination Helper

Status: active

## Summary

Add a shared core helper for simple paginated mock lists.

## Goal

Official host mock adapters should not repeat page/pageSize coercion, start index math, and `hasMore` calculation for reusable product matrix demos.

## Scope

- In scope:
  - add a generic mock pagination helper to `packages/core/src/runtime/mock-request.ts`
  - add focused runtime tests
- Out of scope:
  - moving product-specific mock fixture data into core
  - changing adapter auth behavior

## Ownership

- owned files:
  - `packages/core/src/runtime/mock-request.ts`
  - `packages/core/src/runtime/mock-request.test.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - app mock adapters

## Verification

- slice gate: `pnpm test -- packages/core/src/runtime/*.test.ts`

## Acceptance

- [ ] mock pagination helper is exported through `@minix/core`
- [ ] helper keeps fixture data host-owned
- [ ] runtime tests cover defaults and `hasMore`
- [ ] `pnpm verify` run, or skipped with reason if docs-only
