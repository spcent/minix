# Content Schema Constant Adoption

Status: done

## Summary

Adopt content and search contract constants plus shared pagination helpers in content request schemas.

## Ownership

- owned files: `apps/api/src/domains/content/schemas.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] content schemas reuse search, content model, publication, visibility, lifecycle, and actor role constants
- [x] content and novel route validation remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Reused content and search contract constants for exact schema enum surfaces.
- Reused the API pagination helper for content feed, review queue, and novel list queries.
