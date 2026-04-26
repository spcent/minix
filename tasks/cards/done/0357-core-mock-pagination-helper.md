# Core Mock Pagination Helper

Status: done

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

- [x] mock pagination helper is exported through `@minix/core`
- [x] helper keeps fixture data host-owned
- [x] runtime tests cover defaults and `hasMore`
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added `paginateMockItems` and the `PaginatedMockList` envelope to core mock request helpers.
- Covered explicit page/pageSize input, default page size, and terminal `hasMore: false`.
- Ran `pnpm test -- packages/core/src/runtime/*.test.ts`; the repo test script executed successfully.
