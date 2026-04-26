# Message Stored Record Snapshot Helper

Status: done

## Summary

Add a reusable helper for cloning stored message thread records.

## Goal

Stored message thread records should have a reusable snapshot path that composes thread and message item helpers.

## Scope

- In scope:
  - add `cloneStoredMessageThreadRecord`
  - cover nested thread and messages clone isolation
- Out of scope:
  - changing stored state shape
  - changing thread sync behavior

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

- [x] stored record helper clones thread
- [x] stored record helper clones messages
- [x] sync cursor and updated timestamp are preserved
- [x] `pnpm verify:api` run for this code slice

## Completion Notes

- Added `cloneStoredMessageThreadRecord` as the record-level composition helper.
- Reused thread and message item snapshot helpers instead of duplicating nested clone behavior.
- Covered thread, messages, cursor, and timestamp preservation in API domain tests.
