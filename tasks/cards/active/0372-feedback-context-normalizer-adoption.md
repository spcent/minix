# Feedback Context Normalizer Adoption

Status: active

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

- [ ] feedback submit normalization uses the shared context helper
- [ ] feedback context output shape is unchanged
- [ ] API tests still pass
- [ ] `pnpm verify` run, or skipped with reason if docs-only
