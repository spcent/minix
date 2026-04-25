# Payment Schema Constant Adoption

Status: active

## Summary

Adopt payment contract constants and shared pagination helpers in payment request schemas.

## Ownership

- owned files: `apps/api/src/domains/payment/schemas.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] payment schemas reuse order, product, channel, provider mode, and gateway provider constants
- [ ] payment route validation remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
