# Ops Job Kind Constant Foundation

Status: active

## Summary

Add API-local constants for operational background job kinds.

## Ownership

- owned files: `apps/api/src/types.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] operational job kind union is backed by a constant tuple
- [ ] existing operational state shape remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
