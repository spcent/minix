# Feedback Ticket Clone Helper Adoption

Status: done

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

- [x] feedback source context projection uses the optional snapshot helper
- [x] feedback actor context projection uses the optional snapshot helper
- [x] API tests still pass
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Refactored `cloneFeedbackTicket` to normalize optional `sourceContext` and `actorContext` through `cloneOptionalDomainSnapshot`.
- Preserved existing ticket response shape and asset cloning behavior.
- Verified with `pnpm verify:api`.
