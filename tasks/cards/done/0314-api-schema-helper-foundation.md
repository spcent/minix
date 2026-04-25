# API Schema Helper Foundation

Status: done

## Summary

Add small API-domain schema helpers for repeated pagination, boolean query, route params, source context, actor context, and auth redirect fragments.

## Ownership

- owned files: `apps/api/src/domains/schema-helpers.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] shared schema helpers cover repeated API request fragments without changing envelopes
- [x] helpers stay local to `apps/api/src/domains`
- [x] docs note API schema fragment reuse
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added local API schema helpers for pagination, boolean query flags, route params, source context, actor context, and auth redirect targets.
- Documented schema fragment reuse in the product matrix reuse playbook.
