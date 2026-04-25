# Payment Request Constant Foundation

Status: active

## Summary

Add contract constants for membership plan ids, payment scenarios, and payment callback outcomes.

## Ownership

- owned files: `packages/contracts/src/api/membership.ts`, `packages/contracts/src/api/payment.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] payment request-only string unions have exported constants
- [ ] existing payment contract types remain compatible
- [ ] `pnpm verify` run, or skipped with reason if docs-only
