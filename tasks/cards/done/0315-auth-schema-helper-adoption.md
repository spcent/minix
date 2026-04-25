# Auth Schema Helper Adoption

Status: done

## Summary

Adopt shared API schema helpers and contract constants in auth request schemas.

## Ownership

- owned files: `apps/api/src/domains/auth/schemas.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] auth schemas reuse redirect, login method, purpose, and merge strategy constants
- [x] auth request behavior stays unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Reused the shared auth redirect target schema.
- Replaced duplicated login method, verification purpose, and merge strategy string lists with contract constants.
