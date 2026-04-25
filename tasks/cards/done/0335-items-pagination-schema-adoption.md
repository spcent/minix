# Items Pagination Schema Adoption

Status: done

## Summary

Adopt shared API pagination query shape in the items domain schema.

## Ownership

- owned files: `apps/api/src/domains/items/schemas.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] items query schema reuses API pagination helper
- [x] items route behavior remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced local items pagination fields with `apiPaginationQueryShape`.
