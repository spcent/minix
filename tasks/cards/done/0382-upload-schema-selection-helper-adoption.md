# Upload Schema Selection Helper Adoption

Status: done

## Summary

Use shared upload task, error, and transfer helpers in upload schema selection normalization.

## Goal

`normalizeUploadSelectionResult` should delegate reusable projection logic and keep only selection-level assembly.

## Scope

- In scope:
  - refactor `normalizeUploadSelectionResult`
  - preserve upload session request normalization output
- Out of scope:
  - changing upload schemas
  - changing feedback upload asset normalization

## Ownership

- owned files:
  - `apps/api/src/domains/uploads/schemas.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] selection upload task uses shared helper
- [x] selection upload error and transfer use shared helpers
- [x] API tests still pass
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Refactored `normalizeUploadSelectionResult` to delegate task, error, and transfer projection to shared helpers.
- Kept `normalizeUploadAsset` as the asset-level projection path.
- Verified with `pnpm verify:api`.
