# API Payment Catalog Snapshot Cleanup

Status: active

## Summary

Adopt API-domain snapshot helpers in payment product and SKU catalog cloning.

## Ownership

- owned files: `apps/api/src/domains/payment/catalog.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] payment catalog product and SKU clones use API snapshot helpers
- [ ] payment catalog response shape remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
