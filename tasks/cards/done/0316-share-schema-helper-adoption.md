# Share Schema Helper Adoption

Status: done

## Summary

Adopt shared API schema helpers and share contract constants in share request schemas.

## Ownership

- owned files: `apps/api/src/domains/share/schemas.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] share schemas reuse redirect, context, scenario, channel, and return outcome constants
- [x] normalizeSharePrepareRequest output remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Reused API redirect, route params, source context, and actor context schema fragments.
- Replaced duplicated share scenario, channel, and return outcome string lists with contract constants.
