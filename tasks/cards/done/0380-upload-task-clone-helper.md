# Upload Task Clone Helper

Status: done

## Summary

Add a shared upload task clone helper built on the nested upload task helpers.

## Goal

Upload task shaping should have one reusable implementation for schema request normalization and pipeline response projection.

## Scope

- In scope:
  - add `cloneUploadTask`
  - cover integrity, chunk counters, and optional task fields in tests
- Out of scope:
  - changing upload task contracts
  - changing upload session creation

## Ownership

- owned files:
  - `apps/api/src/domains/uploads/tasks.ts`
  - `apps/api/src/domains/uploads/tasks.test.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] task helper clones required fields
- [x] task helper preserves defined optional fields
- [x] nested progress, governance, and lifecycle objects are not shared
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added `cloneUploadTask` and `cloneUploadIntegrity`.
- Covered optional task fields and nested clone isolation in tests.
- Verified with `pnpm verify:api`.
