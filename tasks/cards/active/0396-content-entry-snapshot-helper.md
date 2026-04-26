# Content Entry Snapshot Helper

Status: active

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

- [ ] entry helper clones lifecycle and tags
- [ ] entry helper clones attachments, review, audit, roles, and authoring
- [ ] stored scalar fields are preserved
- [ ] `pnpm verify` run, or skipped with reason if docs-only
