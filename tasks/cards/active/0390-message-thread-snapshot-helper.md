# Message Thread Snapshot Helper

Status: active

## Summary

Add a reusable helper for cloning message threads.

## Goal

Message thread snapshots should centralize participant labels, touchpoints, members, and optional thread metadata cloning.

## Scope

- In scope:
  - add `cloneMessageThread`
  - preserve touchpoint cloning behavior
  - cover nested array/object clone behavior in tests
- Out of scope:
  - changing message touchpoint semantics
  - changing message contracts

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

- [ ] thread helper clones participant labels
- [ ] thread helper clones member arrays
- [ ] optional thread metadata snapshots are cloned
- [ ] `pnpm verify` run, or skipped with reason if docs-only
