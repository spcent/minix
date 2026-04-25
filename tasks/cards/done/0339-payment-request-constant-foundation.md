# Payment Request Constant Foundation

Status: done

## Summary

Add contract constants for membership plan ids, payment scenarios, and payment callback outcomes.

## Ownership

- owned files: `packages/contracts/src/api/membership.ts`, `packages/contracts/src/api/payment.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] payment request-only string unions have exported constants
- [x] existing payment contract types remain compatible
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added membership plan, payment scenario, and callback outcome constants/types.
