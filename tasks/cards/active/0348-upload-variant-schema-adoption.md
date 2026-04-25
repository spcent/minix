# Upload Variant Schema Adoption

Status: active

## Summary

Adopt upload derived asset variant constants in upload schemas.

## Ownership

- owned files: `apps/api/src/domains/uploads/schemas.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] upload derived asset variant schema reuses contract constants
- [ ] upload route behavior remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
