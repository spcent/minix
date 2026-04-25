# Message Schema Helper Adoption

Status: active

## Summary

Adopt shared API schema helpers and message contract constants in notification and thread schemas.

## Ownership

- owned files: `apps/api/src/domains/messages/schemas.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] message schemas reuse pagination, query booleans, contexts, notification types, thread types, reply policies, and sort constants
- [ ] notification and thread route behavior remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
