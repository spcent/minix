# Account Cancellation Schema Adoption

Status: done

## Summary

Adopt account cancellation action and reason constants in account schemas.

## Ownership

- owned files: `apps/api/src/domains/account/schemas.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] account cancellation schema reuses contract constants
- [x] account cancellation route behavior remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Reused `ACCOUNT_CANCELLATION_ACTIONS` and `ACCOUNT_CANCELLATION_REASONS` in the account API schema.
