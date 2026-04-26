# Content Snapshot Export Tightening

Status: active

## Summary

Tighten managed-content snapshot exports and tests for reuse clarity.

## Goal

The new content snapshot module should expose only reusable domain helpers with clear type-level coverage, making it safe to reuse from future product matrix surfaces.

## Scope

- In scope:
  - refine snapshot helper signatures where needed
  - add focused assertions for optional field omission and preservation
  - run the full verification gate
- Out of scope:
  - adding new content capabilities
  - changing generated outputs

## Ownership

- owned files:
  - `apps/api/src/domains/content/snapshots.ts`
  - `apps/api/src/domains/content/snapshots.test.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- final gate: `pnpm verify`

## Acceptance

- [ ] snapshot helpers keep optional fields exact
- [ ] tests cover omitted optional fields
- [ ] exported helper surface remains focused
- [ ] `pnpm verify` passes
