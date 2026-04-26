# Message Item Snapshot Helper

Status: done

## Summary

Add reusable helpers for cloning message body items and message item arrays.

## Goal

Message item snapshots should centralize optional delivery/read/failure fields and touchpoint cloning.

## Scope

- In scope:
  - add `cloneMessageBodyItem`
  - add `cloneMessageItems`
  - cover touchpoint array clone behavior
- Out of scope:
  - changing message delivery state
  - changing notification touchpoint behavior

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

- [x] message item helper preserves optional delivery fields
- [x] message item array helper returns new items
- [x] touchpoint arrays are not shared
- [x] `pnpm verify:api` run for this code slice

## Completion Notes

- Added `cloneMessageBodyItem` and `cloneMessageItems` to the message snapshot helper module.
- Kept delivery, read, failure, retry, and touchpoint semantics equivalent to the existing runtime clone path.
- Covered single-item and array clone isolation in API domain tests.
