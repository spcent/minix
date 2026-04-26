# Upload Pipeline Asset Helper Adoption

Status: done

## Summary

Use the shared upload asset clone helper in upload pipeline projections.

## Goal

Upload pipeline response cloning should align with schema normalization and avoid a second private asset clone implementation.

## Scope

- In scope:
  - remove or replace the private `cloneUploadAsset` implementation in pipeline
  - preserve pipeline response shapes
- Out of scope:
  - changing transfer lifecycle behavior
  - changing provider posture logic

## Ownership

- owned files:
  - `apps/api/src/domains/uploads/pipeline.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] upload pipeline uses the shared asset clone helper
- [x] private duplicate asset clone logic is removed
- [x] API tests still pass
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced the upload pipeline private `cloneUploadAsset` implementation with the shared helper.
- Kept existing pipeline response call sites unchanged.
- Verified with `pnpm verify:api`.
