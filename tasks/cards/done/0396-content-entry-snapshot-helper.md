# Content Entry Snapshot Helper

Status: done

## Summary

Add a reusable managed-content entry snapshot helper.

## Goal

Stored managed-content entries should clone nested lifecycle, tags, attachments, review, audit, roles, and authoring through one reusable helper.

## Scope

- In scope:
  - add `ManagedContentEntry` snapshot type alias
  - add `cloneManagedContentEntry`
  - cover nested clone isolation in tests
- Out of scope:
  - changing stored state shape
  - changing content seed data

## Ownership

- owned files:
  - `apps/api/src/domains/content/snapshots.ts`
  - `apps/api/src/domains/content/snapshots.test.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] entry helper clones lifecycle and tags
- [x] entry helper clones attachments, review, audit, roles, and authoring
- [x] stored scalar fields are preserved
- [x] `pnpm verify:api` run for this code slice

## Completion Notes

- Added `ManagedContentEntrySnapshot` and `cloneManagedContentEntry`.
- Composed the entry clone from lifecycle, review, audit, and authoring snapshot helpers.
- Covered scalar preservation and nested clone isolation in API domain tests.
