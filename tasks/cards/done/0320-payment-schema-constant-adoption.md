# Payment Schema Constant Adoption

Status: done

## Summary

Adopt payment contract constants and shared pagination helpers in payment request schemas.

## Ownership

- owned files: `apps/api/src/domains/payment/schemas.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] payment schemas reuse order, product, channel, provider mode, and gateway provider constants
- [x] payment route validation remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Reused payment contract constants for provider, channel, order, and product validation.
- Reused the API pagination query helper for order list queries.
