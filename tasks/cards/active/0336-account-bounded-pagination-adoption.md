# Account Bounded Pagination Adoption

Status: active

## Summary

Adopt bounded API page-size helpers in account relation and asset history schemas.

## Ownership

- owned files: `apps/api/src/domains/account/schemas.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] account relation schemas use the 50-item page-size helper
- [ ] account asset history schema uses the 100-item page-size helper
- [ ] account route behavior remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
