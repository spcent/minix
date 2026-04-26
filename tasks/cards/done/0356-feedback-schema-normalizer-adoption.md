# Feedback Schema Normalizer Adoption

Status: done

## Summary

Use shared API schema normalizers inside feedback request shaping.

## Goal

Feedback/support request normalization should share source and actor context shaping with share and future product domains.

## Scope

- In scope:
  - refactor `apps/api/src/domains/feedback/schemas.ts` context normalization
  - preserve submit feedback request output shape
  - keep upload asset normalization domain-owned
- Out of scope:
  - changing ticket lifecycle behavior
  - changing feedback contracts

## Ownership

- owned files:
  - `apps/api/src/domains/feedback/schemas.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] feedback normalizer removes duplicated context copy logic
- [x] attachment and screenshot asset normalization stays unchanged
- [x] API tests still pass
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Reused API source and actor context normalizers in feedback submit request shaping.
- Left upload asset normalization in the upload-owned schema helper.
- Ran `pnpm verify:api`; it passed.
