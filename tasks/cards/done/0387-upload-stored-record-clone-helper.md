# Upload Stored Record Clone Helper

Status: done

## Summary

Add a shared helper for cloning complete stored upload records.

## Goal

Stored upload record projection should be reusable and keep nested task, asset, transfer, session, review, cleanup, and reference snapshots consistent.

## Scope

- In scope:
  - add stored upload record clone helper
  - compose existing upload task, asset, transfer, session, review, cleanup, and reference helpers
  - cover nested collection clone isolation in tests
- Out of scope:
  - changing stored upload record shape
  - changing upload persistence

## Ownership

- owned files:
  - `apps/api/src/domains/uploads/records.ts`
  - `apps/api/src/domains/uploads/records.test.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] stored record helper clones nested upload selection
- [x] chunks and references collections are not shared
- [x] binary maps are copied
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added `cloneUploadSelectionResult` and `cloneStoredUploadRecord`.
- Composed existing upload task, asset, transfer, session, review, cleanup, and reference helpers.
- Covered nested collection and map clone isolation in tests.
- Verified with `pnpm verify:api`.
