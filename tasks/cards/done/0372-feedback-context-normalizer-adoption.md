# Feedback Context Normalizer Adoption

Status: done

## Summary

Adopt the shared API context snapshot normalizer in feedback submit schema normalization.

## Goal

Feedback context normalization should be reusable and consistent with message, upload, and share domains.

## Scope

- In scope:
  - refactor `normalizeSubmitFeedbackRequest`
  - preserve feedback submit request shape
- Out of scope:
  - changing feedback ticket runtime behavior
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

- [x] feedback submit normalization uses the shared context helper
- [x] feedback context output shape is unchanged
- [x] API tests still pass
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced duplicated feedback submit context normalization in `normalizeSubmitFeedbackRequest`.
- Preserved existing feedback context scalar fields and upload asset normalization.
- Verified with `pnpm verify:api`.
