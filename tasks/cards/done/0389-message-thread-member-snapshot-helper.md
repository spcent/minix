# Message Thread Member Snapshot Helper

Status: done

## Summary

Add a reusable helper for cloning message thread members.

## Goal

Message thread member snapshots should not be private to the thread runtime module so they can be reused by future message projections.

## Scope

- In scope:
  - add `apps/api/src/domains/messages/snapshots.ts`
  - add `cloneThreadMembers`
  - cover optional joined-at behavior in tests
- Out of scope:
  - changing message contracts
  - changing thread runtime behavior

## Ownership

- owned files:
  - `apps/api/src/domains/messages/snapshots.ts`
  - `apps/api/src/domains/messages/snapshots.test.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] member helper preserves required fields
- [x] joined-at optional field is preserved when defined
- [x] returned member array is not shared
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added `cloneThreadMembers` in the messages snapshot helper module.
- Covered member array and object clone isolation in tests.
- Verified with `pnpm verify:api`.
