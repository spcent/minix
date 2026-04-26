# API Domain Optional Snapshot Helper

Status: done

## Summary

Add an API-domain helper for cloning optional nested snapshots.

## Goal

API domain code should not repeat conditional `value ? cloneDomainSnapshot(value) : undefined` logic when copying optional nested context and metadata.

## Scope

- In scope:
  - add `cloneOptionalDomainSnapshot` to `apps/api/src/domains/snapshot.ts`
  - add focused tests for defined and undefined values
- Out of scope:
  - changing response envelopes
  - importing frontend/core snapshot helpers into the API app

## Ownership

- owned files:
  - `apps/api/src/domains/snapshot.ts`
  - `apps/api/src/domains/snapshot.test.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] optional snapshot helper is available to API domains
- [x] helper preserves undefined values
- [x] helper deep-clones defined values
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added `cloneOptionalDomainSnapshot` to the API-domain snapshot helpers.
- Added focused tests for deep-cloning values, arrays, and optional undefined values.
- Ran `pnpm verify:api`; it passed.
