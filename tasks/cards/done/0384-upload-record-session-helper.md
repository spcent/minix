# Upload Record Session Helper

Status: done

## Summary

Add shared helpers for cloning upload chunk receipts and upload sessions.

## Goal

Upload record projection should reuse small, explicit helpers for transfer receipts and session snapshots before moving pipeline record cloning out of the pipeline module.

## Scope

- In scope:
  - add `apps/api/src/domains/uploads/records.ts`
  - add chunk receipt and session clone helpers
  - cover scalar clone behavior in tests
- Out of scope:
  - changing upload contracts
  - changing upload chunk processing

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

- [x] chunk receipt helper preserves receipt fields
- [x] session helper preserves session fields
- [x] API tests still pass
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added `cloneUploadChunkReceipt` and `cloneUploadSession`.
- Covered field preservation for chunk receipts and backend upload sessions.
- Verified with `pnpm verify:api`.
