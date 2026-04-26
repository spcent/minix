# Upload Task Nested Helper

Status: done

## Summary

Add shared helpers for cloning upload task nested progress, governance, and lifecycle objects.

## Goal

Upload task projection code should preserve optional field semantics through one reusable path before schema and pipeline adoption.

## Scope

- In scope:
  - add upload task projection helpers under `apps/api/src/domains/uploads`
  - cover array and optional field clone behavior in tests
- Out of scope:
  - changing upload contracts
  - changing upload runtime state transitions

## Ownership

- owned files:
  - `apps/api/src/domains/uploads/tasks.ts`
  - `apps/api/src/domains/uploads/tasks.test.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] progress clone preserves scalar fields
- [x] governance clone copies accepted file type arrays
- [x] lifecycle clone preserves defined optional fields
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added shared upload progress, governance, and lifecycle clone helpers.
- Covered scalar preservation, array clone isolation, and optional lifecycle fields in tests.
- Verified with `pnpm verify:api`.
