# Ops Job Kind Constant Foundation

Status: done

## Summary

Add API-local constants for operational background job kinds.

## Ownership

- owned files: `apps/api/src/types.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] operational job kind union is backed by a constant tuple
- [x] existing operational state shape remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added `OPERATIONAL_JOB_KINDS` and derived `OperationalJobKind` from it.
