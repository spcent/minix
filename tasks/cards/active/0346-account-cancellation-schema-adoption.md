# Account Cancellation Schema Adoption

Status: active

## Summary

Adopt account cancellation action and reason constants in account schemas.

## Ownership

- owned files: `apps/api/src/domains/account/schemas.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] account cancellation schema reuses contract constants
- [ ] account cancellation route behavior remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
