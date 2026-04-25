# Account Bounded Pagination Adoption

Status: done

## Summary

Adopt bounded API page-size helpers in account relation and asset history schemas.

## Ownership

- owned files: `apps/api/src/domains/account/schemas.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] account relation schemas use the 50-item page-size helper
- [x] account asset history schema uses the 100-item page-size helper
- [x] account route behavior remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced local bounded page-size schemas with shared API helpers.
