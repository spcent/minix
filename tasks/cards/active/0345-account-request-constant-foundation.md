# Account Request Constant Foundation

Status: active

## Summary

Add user contract constants for account cancellation actions and reasons.

## Ownership

- owned files: `packages/contracts/src/api/user.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] account cancellation action and reason unions have exported constants
- [ ] existing user contract types remain compatible
- [ ] `pnpm verify` run, or skipped with reason if docs-only
