# Upload Schema Asset Helper Adoption

Status: active

## Summary

Use the shared upload asset clone helper in upload schema normalization.

## Goal

`normalizeUploadAsset` should reuse the shared asset projection path instead of maintaining its own metadata and variant shaping.

## Scope

- In scope:
  - refactor `normalizeUploadAsset`
  - preserve schema-normalized upload asset output shape
- Out of scope:
  - changing upload schemas
  - changing feedback schema usage of upload assets

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

- [ ] schema normalization delegates upload asset shaping to shared helper
- [ ] feedback submit normalization still reuses `normalizeUploadAsset`
- [ ] API tests still pass
- [ ] `pnpm verify` run, or skipped with reason if docs-only
