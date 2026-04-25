# Content Schema Constant Adoption

Status: active

## Summary

Adopt content and search contract constants plus shared pagination helpers in content request schemas.

## Ownership

- owned files: `apps/api/src/domains/content/schemas.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] content schemas reuse search, content model, publication, visibility, lifecycle, and actor role constants
- [ ] content and novel route validation remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
