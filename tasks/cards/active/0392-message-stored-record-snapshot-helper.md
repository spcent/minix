# Message Stored Record Snapshot Helper

Status: active

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

- [ ] stored record helper clones thread
- [ ] stored record helper clones messages
- [ ] sync cursor and updated timestamp are preserved
- [ ] `pnpm verify` run, or skipped with reason if docs-only
