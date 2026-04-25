# Message Schema Helper Adoption

Status: done

## Summary

Adopt shared API schema helpers and message contract constants in notification and thread schemas.

## Ownership

- owned files: `apps/api/src/domains/messages/schemas.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] message schemas reuse pagination, query booleans, contexts, notification types, thread types, reply policies, and sort constants
- [x] notification and thread route behavior remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Reused API pagination, boolean query, source context, and actor context fragments.
- Replaced duplicated notification/thread type, reply policy, and sort string lists with contract constants.
