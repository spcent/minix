# Upload Derived Variant Helper Adoption

Status: done

## Summary

Use shared variant construction helpers for derived upload asset variants.

## Goal

Derived upload asset variants should use the same optional dimension shaping as cloned upload asset variants.

## Scope

- In scope:
  - add a small derived variant builder to the upload asset helper module
  - refactor `createDerivedAssetVariants`
- Out of scope:
  - changing derived asset policy
  - changing review annotations

## Ownership

- owned files:
  - `apps/api/src/domains/uploads/assets.ts`
  - `apps/api/src/domains/uploads/assets.test.ts`
  - `apps/api/src/domains/uploads/pipeline.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] derived variant builder preserves optional dimensions
- [x] thumbnail scaling remains unchanged
- [x] API tests still pass
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added `createUploadAssetVariant` to centralize optional dimension shaping.
- Refactored derived original, thumbnail, and cover variants to use the shared builder.
- Verified with `pnpm verify:api`.
