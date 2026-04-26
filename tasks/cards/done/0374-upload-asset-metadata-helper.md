# Upload Asset Metadata Helper

Status: done

## Summary

Add shared helpers for cloning upload asset metadata and derived variants.

## Goal

Upload asset projection code should not duplicate metadata and variant field shaping in schema and pipeline modules.

## Scope

- In scope:
  - add an upload asset helper module under `apps/api/src/domains/uploads`
  - cover metadata, variants, and review annotation cloning in tests
- Out of scope:
  - changing upload contracts
  - changing upload provider behavior

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

- [x] metadata helper preserves defined optional scalar fields
- [x] variant helper preserves variant dimensions
- [x] review annotations are cloned, not shared
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added `cloneUploadAssetVariant` and `cloneUploadAssetMetadata` in the uploads domain.
- Added tests for optional dimensions, variants, and review annotation clone isolation.
- Verified with `pnpm verify:api`.
