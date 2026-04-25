# Auth Request Schema Adoption

Status: done

## Summary

Adopt remaining auth contract constants in auth request schemas.

## Ownership

- owned files: `apps/api/src/domains/auth/schemas.ts`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] auth platform, OAuth purpose, identity method, and bind workflow schemas reuse contract constants
- [x] auth route behavior remains unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced remaining auth request enum literals with auth contract constants.
