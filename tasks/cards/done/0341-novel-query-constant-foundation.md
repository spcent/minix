# Novel Query Constant Foundation

Status: done

## Summary

Add contract constants for novel statuses and novel sort values.

## Ownership

- owned files: `packages/contracts/src/api/novels.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] novel status and sort unions are backed by exported constants
- [x] novel contract types remain compatible
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added exported novel status and sort value constants and derived types from them.
