# Upload Transfer Error Helper

Status: active

## Summary

Add shared helpers for cloning upload errors and transfer payloads.

## Goal

Upload selection results should reuse common error and transfer projection logic instead of duplicating chunk mapping in schema and pipeline modules.

## Scope

- In scope:
  - add upload error clone helper
  - add transfer payload clone helper
  - cover chunk array clone behavior in tests
- Out of scope:
  - changing upload transfer contracts
  - changing chunk checksum behavior

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

- [ ] upload error helper preserves error fields
- [ ] transfer helper clones chunk arrays
- [ ] API tests still pass
- [ ] `pnpm verify` run, or skipped with reason if docs-only
