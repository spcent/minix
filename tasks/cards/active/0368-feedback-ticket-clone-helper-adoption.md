# Feedback Ticket Clone Helper Adoption

Status: active

## Summary

Use the optional snapshot helper inside feedback ticket cloning.

## Goal

Feedback ticket projections should use the shared optional snapshot convention for nested context fields.

## Scope

- In scope:
  - refactor `cloneFeedbackTicket` in `apps/api/src/domains/feedback/support.ts`
  - preserve feedback ticket response shape
- Out of scope:
  - changing list summaries
  - changing feedback contracts

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

- [ ] feedback source context projection uses the optional snapshot helper
- [ ] feedback actor context projection uses the optional snapshot helper
- [ ] API tests still pass
- [ ] `pnpm verify` run, or skipped with reason if docs-only
