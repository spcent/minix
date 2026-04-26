# Content Review Audit Snapshot Helper

Status: done

## Summary

Add reusable managed-content review and audit snapshot helpers.

## Goal

Managed content review records and audit history should have a shared clone path instead of private runtime-only helpers.

## Scope

- In scope:
  - add content snapshot helper module
  - add `cloneManagedContentReviewRecord`
  - add `cloneManagedContentAuditHistory`
  - cover clone isolation in tests
- Out of scope:
  - changing content contracts
  - changing review workflow behavior

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

- [x] review record helper clones records
- [x] audit history helper clones arrays and entries
- [x] helper tests cover mutation isolation
- [x] `pnpm verify:api` run for this code slice

## Completion Notes

- Added `apps/api/src/domains/content/snapshots.ts` for managed-content snapshot helpers.
- Added review record and audit history clone helpers backed by domain snapshot primitives.
- Covered review and audit clone isolation in API domain tests.
