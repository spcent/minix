# API Schema Helper Foundation

Status: active

## Summary

Add small API-domain schema helpers for repeated pagination, boolean query, route params, source context, actor context, and auth redirect fragments.

## Ownership

- owned files: `apps/api/src/domains/schema-helpers.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] shared schema helpers cover repeated API request fragments without changing envelopes
- [ ] helpers stay local to `apps/api/src/domains`
- [ ] docs note API schema fragment reuse
- [ ] `pnpm verify` run, or skipped with reason if docs-only
