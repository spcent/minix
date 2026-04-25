# Upload Variant Constant Foundation

Status: done

## Summary

Add upload contract constants for derived asset variant kinds.

## Ownership

- owned files: `packages/contracts/src/api/upload.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] upload derived asset variant kind union is backed by an exported constant
- [x] upload contract types remain compatible
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added exported upload derived asset variant constants and reused the derived literal type in `UploadDerivedAssetVariant`.
