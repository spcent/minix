# Settings Schema Constant Adoption

Status: done

## Summary

Adopt settings contract constants in settings request schemas.

## Ownership

- owned files: `apps/api/src/domains/settings/schemas.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] settings schemas reuse network strategy, notification channel, and profile visibility constants
- [x] settings update behavior remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced duplicated settings enum lists with settings contract constants for update validation.
