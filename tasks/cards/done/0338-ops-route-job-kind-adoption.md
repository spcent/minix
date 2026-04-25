# Ops Route Job Kind Adoption

Status: done

## Summary

Adopt the operational job kind constants in ops route schemas and route input typing.

## Ownership

- owned files: `apps/api/src/domains/ops/routes.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] ops run-jobs schema reuses operational job kind constants
- [x] route input typing reuses `OperationalJobKind`
- [x] ops route behavior remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Reused `OPERATIONAL_JOB_KINDS` and `OperationalJobKind` in ops route validation and input typing.
