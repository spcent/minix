# Auth Request Schema Adoption

Status: active

## Summary

Adopt remaining auth contract constants in auth request schemas.

## Ownership

- owned files: `apps/api/src/domains/auth/schemas.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] auth platform, OAuth purpose, identity method, and bind workflow schemas reuse contract constants
- [ ] auth route behavior remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
