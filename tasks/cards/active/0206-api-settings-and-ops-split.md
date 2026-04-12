# Card 0206 API Settings And Ops Split

## Summary

Split settings-state and operational-governance helpers into dedicated modules.

## Goal

Move shared settings policy and operational state construction out of the monolithic data file, while moving related routes out of the API entry file.

## Milestone

- milestone file: none
- slice name: `api settings and ops split`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add `domains/settings/routes.ts`
  - add `domains/settings/schemas.ts`
  - add `domains/settings/state.ts`
  - add `domains/ops/routes.ts`
  - add `domains/ops/jobs.ts`
  - move settings and ops helpers/routes from `app.ts` and `data.ts`
- Out of scope:
  - changing policy semantics or background job behavior

## Ownership

- owned files:
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - `apps/api/src/domains/settings/**`
  - `apps/api/src/domains/ops/**`
  - `tasks/cards/active/0206-api-settings-and-ops-split.md`

## Dependencies

- depends on:
  - `0201-api-http-infra-extraction.md`
- blocked by:
  - none
- integration notes:
  - settings stays a domain helper, not a new global util bucket

## Affected Paths

- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- `apps/api/src/domains/settings/**`
- `apps/api/src/domains/ops/**`

## Verification

- slice gate:
  - settings and ops helpers are extracted with behavior unchanged
- generation needed:
  - none
- final verifier handoff:
  - include API verification command and touched settings/ops endpoints

## Acceptance

- [x] settings routes and schemas are moved out of `app.ts`
- [x] settings state helpers are moved out of `data.ts`
- [x] operational state helpers are moved out of `data.ts`
- [x] `pnpm verify:api` run

## Verification Notes

- 2026-04-12: `pnpm -s exec tsc -p tsconfig.json --noEmit`
- 2026-04-12: `pnpm verify:api`
- 2026-04-12: `pnpm verify`
