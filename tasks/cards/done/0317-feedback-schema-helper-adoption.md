# Feedback Schema Helper Adoption

Status: done

## Summary

Adopt shared API schema helpers and feedback contract constants in feedback request schemas.

## Ownership

- owned files: `apps/api/src/domains/feedback/schemas.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] feedback schemas reuse pagination, source context, actor context, ticket state, type, and priority constants
- [x] feedback normalization output remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Reused API pagination, source context, and actor context fragments in feedback schemas.
- Replaced duplicated feedback type, priority, and ticket state query values with contract constants.
