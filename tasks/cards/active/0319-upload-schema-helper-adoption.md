# Upload Schema Helper Adoption

Status: active

## Summary

Adopt shared API schema helpers and upload contract constants in upload request schemas.

## Ownership

- owned files: `apps/api/src/domains/uploads/schemas.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] upload schemas reuse context helpers and upload file type, stage, scenario, status, checksum, transfer, and owner constants
- [ ] upload normalization output remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
