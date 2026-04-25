# Feedback Schema Helper Adoption

Status: active

## Summary

Adopt shared API schema helpers and feedback contract constants in feedback request schemas.

## Ownership

- owned files: `apps/api/src/domains/feedback/schemas.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] feedback schemas reuse pagination, source context, actor context, ticket state, type, and priority constants
- [ ] feedback normalization output remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
