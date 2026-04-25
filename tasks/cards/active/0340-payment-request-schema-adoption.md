# Payment Request Schema Adoption

Status: active

## Summary

Adopt membership plan, payment scenario, and callback outcome constants in payment schemas.

## Ownership

- owned files: `apps/api/src/domains/payment/schemas.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] payment schemas reuse request constants for plan, scenario, and callback outcome
- [ ] payment route behavior remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
