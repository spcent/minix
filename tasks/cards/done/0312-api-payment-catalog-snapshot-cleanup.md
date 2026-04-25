# API Payment Catalog Snapshot Cleanup

Status: done

## Summary

Adopt API-domain snapshot helpers in payment product and SKU catalog cloning.

## Ownership

- owned files: `apps/api/src/domains/payment/catalog.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] payment catalog product and SKU clones use API snapshot helpers
- [x] payment catalog response shape remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced payment product and SKU copy helpers with `cloneDomainSnapshot`.
- Kept payment catalog response shape unchanged.
