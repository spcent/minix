# Ops Route Job Kind Adoption

Status: active

## Summary

Adopt the operational job kind constants in ops route schemas and route input typing.

## Ownership

- owned files: `apps/api/src/domains/ops/routes.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] ops run-jobs schema reuses operational job kind constants
- [ ] route input typing reuses `OperationalJobKind`
- [ ] ops route behavior remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
