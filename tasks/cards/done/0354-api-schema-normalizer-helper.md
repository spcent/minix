# API Schema Normalizer Helper

Status: done

## Summary

Add shared API schema normalization helpers for optional context and redirect fragments.

## Goal

API request schemas should reuse one small normalization vocabulary instead of repeating optional object copy logic in each domain.

## Scope

- In scope:
  - add helpers to `apps/api/src/domains/schema-helpers.ts`
  - cover source context, actor context, and auth redirect target fragments
  - add focused tests for omission of undefined optional fields
- Out of scope:
  - changing route behavior or response envelopes

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

- [x] API context normalizers are exported from schema helpers
- [x] undefined optional fields are omitted consistently
- [x] existing request parsing behavior remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added shared normalizers for API source context, actor context, and auth redirect target fragments.
- Added focused tests for undefined omission and explicit `false` preservation.
- Ran `pnpm verify:api`; it passed.
