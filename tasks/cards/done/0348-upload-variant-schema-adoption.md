# Upload Variant Schema Adoption

Status: done

## Summary

Adopt upload derived asset variant constants in upload schemas.

## Ownership

- owned files: `apps/api/src/domains/uploads/schemas.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] upload derived asset variant schema reuses contract constants
- [x] upload route behavior remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Reused `UPLOAD_DERIVED_ASSET_VARIANT_KINDS` in upload asset schema validation.
