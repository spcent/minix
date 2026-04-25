# Items Pagination Schema Adoption

Status: active

## Summary

Adopt shared API pagination query shape in the items domain schema.

## Ownership

- owned files: `apps/api/src/domains/items/schemas.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] items query schema reuses API pagination helper
- [ ] items route behavior remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
