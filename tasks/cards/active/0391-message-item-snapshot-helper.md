# Message Item Snapshot Helper

Status: active

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

- [ ] message item helper preserves optional delivery fields
- [ ] message item array helper returns new items
- [ ] touchpoint arrays are not shared
- [ ] `pnpm verify` run, or skipped with reason if docs-only
