# Upload Asset Clone Helper

Status: done

## Summary

Add a shared upload asset clone helper built on the metadata helpers.

## Goal

Upload asset cloning should have one reusable implementation for API projection and runtime record handling.

## Scope

- In scope:
  - add `cloneUploadAsset` to the upload asset helper module
  - test top-level optional asset fields and nested metadata cloning
- Out of scope:
  - changing upload response shape
  - changing upload persistence behavior

## Ownership

- owned files:
  - `apps/api/src/domains/uploads/assets.ts`
  - `apps/api/src/domains/uploads/assets.test.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] upload asset helper clones top-level fields
- [x] nested metadata and variants are not shared
- [x] API tests still pass
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added `cloneUploadAsset` on top of the metadata helper.
- Covered top-level optional fields and nested clone isolation in tests.
- Verified with `pnpm verify:api`.
