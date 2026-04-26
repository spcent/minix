# Upload Record Review Cleanup Helper

Status: active

## Summary

Add shared helpers for cloning upload review and cleanup records.

## Goal

Review and cleanup record snapshots should use consistent optional-field handling outside the pipeline implementation.

## Scope

- In scope:
  - add review record clone helper
  - add cleanup record clone helper
  - test reason code array clone behavior
- Out of scope:
  - changing review provider posture
  - changing retention policy behavior

## Ownership

- owned files:
  - `apps/api/src/domains/uploads/records.ts`
  - `apps/api/src/domains/uploads/records.test.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] review record helper preserves optional provider fields
- [ ] cleanup record helper preserves optional retention fields
- [ ] review reason codes are cloned, not shared
- [ ] `pnpm verify` run, or skipped with reason if docs-only
