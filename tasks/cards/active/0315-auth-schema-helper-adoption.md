# Auth Schema Helper Adoption

Status: active

## Summary

Adopt shared API schema helpers and contract constants in auth request schemas.

## Ownership

- owned files: `apps/api/src/domains/auth/schemas.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] auth schemas reuse redirect, platform, login method, purpose, merge strategy, and workflow constants
- [ ] auth request behavior stays unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
