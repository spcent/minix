# Auth Request Constant Foundation

Status: active

## Summary

Add auth contract constants for login platforms, OAuth authorize purposes, identity upgrade methods, and bind workflow kinds.

## Ownership

- owned files: `packages/contracts/src/api/auth.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] remaining auth request string unions have exported constants
- [ ] existing auth contract types remain compatible
- [ ] `pnpm verify` run, or skipped with reason if docs-only
