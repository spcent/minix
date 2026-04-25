# Upload Schema Helper Adoption

Status: done

## Summary

Adopt shared API schema helpers and upload contract constants in upload request schemas.

## Ownership

- owned files: `apps/api/src/domains/uploads/schemas.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] upload schemas reuse context helpers and upload file type, stage, scenario, status, checksum, transfer, and owner constants
- [x] upload normalization output remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Reused API source and actor context fragments for upload references.
- Replaced duplicated upload enum lists with upload contract constants where exact constants already exist.
