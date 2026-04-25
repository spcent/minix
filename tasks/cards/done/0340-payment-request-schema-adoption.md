# Payment Request Schema Adoption

Status: done

## Summary

Adopt membership plan, payment scenario, and callback outcome constants in payment schemas.

## Ownership

- owned files: `apps/api/src/domains/payment/schemas.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] payment schemas reuse request constants for plan, scenario, and callback outcome
- [x] payment route behavior remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Reused membership plan, payment scenario, and callback outcome constants in payment schemas.
