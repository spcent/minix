# Account Schema Constant Adoption

Status: active

## Summary

Adopt user/account contract constants and shared pagination helpers in account request schemas.

## Ownership

- owned files: `apps/api/src/domains/account/schemas.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] account schemas reuse relation action, relation list, and asset ledger subject constants
- [ ] account route validation remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
