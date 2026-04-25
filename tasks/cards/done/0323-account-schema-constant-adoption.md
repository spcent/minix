# Account Schema Constant Adoption

Status: done

## Summary

Adopt user/account contract constants and shared pagination helpers in account request schemas.

## Ownership

- owned files: `apps/api/src/domains/account/schemas.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] account schemas reuse relation action, relation list, and asset ledger subject constants
- [x] account route validation remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced duplicated relation action/list and asset subject strings with user contract constants.
- Reused the API page query helper where account query schemas use standard page parsing.
