# Feedback Default Context Snapshot Adoption

Status: done

## Summary

Clone optional feedback source and actor context while creating default feedback ticket context.

## Goal

Feedback ticket context should not retain caller-owned nested context object references after request normalization.

## Scope

- In scope:
  - refactor `createDefaultFeedbackContext` in `apps/api/src/domains/feedback/support.ts`
  - preserve default fallback context behavior
- Out of scope:
  - changing feedback request schemas
  - changing ticket lifecycle behavior

## Ownership

- owned files:
  - `apps/api/src/domains/feedback/support.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] explicit feedback source context is cloned before storage
- [x] explicit feedback actor context is cloned before storage
- [x] fallback context remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Updated `createDefaultFeedbackContext` to clone explicit source and actor context with `cloneOptionalDomainSnapshot`.
- Kept fallback context creation unchanged for requests that do not carry explicit context snapshots.
- Ran `pnpm verify:api`; it passed.
