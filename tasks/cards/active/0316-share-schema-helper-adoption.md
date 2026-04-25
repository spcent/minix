# Share Schema Helper Adoption

Status: active

## Summary

Adopt shared API schema helpers and share contract constants in share request schemas.

## Ownership

- owned files: `apps/api/src/domains/share/schemas.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] share schemas reuse redirect, context, scenario, channel, and return outcome constants
- [ ] normalizeSharePrepareRequest output remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
