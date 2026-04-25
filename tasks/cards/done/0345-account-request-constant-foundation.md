# Account Request Constant Foundation

Status: done

## Summary

Add user contract constants for account cancellation actions and reasons.

## Ownership

- owned files: `packages/contracts/src/api/user.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] account cancellation action and reason unions have exported constants
- [x] existing user contract types remain compatible
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added exported account cancellation action and reason constants in the user contract.
- Reused the new contract literal types in `AccountCancellationRequest`.
