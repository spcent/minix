# Card 0210 API Auth Domain Split And Final App Assembly

## Summary

Split auth into dedicated domain modules and reduce the API entry file to final assembly-only responsibilities.

## Goal

Move auth routes, schemas, session helpers, security helpers, and identity helpers out of `app.ts`, then leave the entry file as a route-assembly layer.

## Milestone

- milestone file: none
- slice name: `api auth domain split and final app assembly`

## Priority

- priority: `P0`

## Scope

- In scope:
  - add `domains/auth/routes.ts`
  - add `domains/auth/schemas.ts`
  - add `domains/auth/session.ts`
  - add `domains/auth/security.ts`
  - add `domains/auth/identity.ts`
  - move auth route and helper logic from `app.ts`
  - finish reducing `app.ts` to app assembly plus store wiring
- Out of scope:
  - changing auth semantics
  - changing identity workflows

## Ownership

- owned files:
  - `apps/api/src/app.ts`
  - `apps/api/src/domains/auth/**`
  - `tasks/cards/active/0210-api-auth-domain-split-and-final-app-assembly.md`

## Dependencies

- depends on:
  - `0201-api-http-infra-extraction.md`
  - `0209-api-account-domain-split.md`
- blocked by:
  - none
- integration notes:
  - auth is last because it touches most shared state and can easily create circular imports

## Affected Paths

- `apps/api/src/app.ts`
- `apps/api/src/domains/auth/**`

## Verification

- slice gate:
  - `app.ts` is reduced to assembly-level concerns and auth behavior remains unchanged
- generation needed:
  - none
- final verifier handoff:
  - include API verification command and app-entry before/after line count

## Acceptance

- [x] auth routes are registered from `domains/auth/routes.ts`
- [x] auth schemas are moved out of `app.ts`
- [x] auth helper clusters are moved out of `app.ts`
- [x] `apps/api/src/app.ts` is assembly-only
- [x] `pnpm verify:api` run

## Notes

- added `apps/api/src/domains/auth/routes.ts`, `apps/api/src/domains/auth/schemas.ts`, `apps/api/src/domains/auth/session.ts`, `apps/api/src/domains/auth/security.ts`, and `apps/api/src/domains/auth/identity.ts`
- `apps/api/src/app.ts` now mounts auth through `registerAuthRoutes(...)` and keeps only app assembly, store wiring, shared payment helpers, and domain registration glue
- `apps/api/src/app.ts` line count reduced from `4075` to `1218`
- verification:
  - `pnpm -s exec tsc -p tsconfig.json --noEmit`
  - `pnpm verify:api`
  - `pnpm verify`
