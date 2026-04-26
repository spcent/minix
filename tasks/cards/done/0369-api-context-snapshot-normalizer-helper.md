# API Context Snapshot Normalizer Helper

Status: done

## Summary

Add a shared API schema helper for normalizing paired source and actor context snapshots.

## Goal

API request schema normalizers should not repeat the same `sourceContext` and `actorContext` normalization boilerplate in every domain.

## Scope

- In scope:
  - add a shared context snapshot normalizer in `apps/api/src/domains/schema-helpers.ts`
  - cover undefined and partially populated contexts in tests
- Out of scope:
  - changing public contracts
  - changing request envelope shapes

## Ownership

- owned files:
  - `apps/api/src/domains/schema-helpers.ts`
  - `apps/api/src/domains/schema-helpers.test.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] shared helper returns only defined normalized context fields
- [x] helper preserves undefined optional context objects
- [x] schema helper tests pass
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added `normalizeApiContextSnapshots` to centralize paired `sourceContext` and `actorContext` schema normalization.
- Covered undefined and partially populated context inputs in schema helper tests.
- Verified with `pnpm verify:api`.
