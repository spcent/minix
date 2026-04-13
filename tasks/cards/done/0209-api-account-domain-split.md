# Card 0209 API Account Domain Split

## Summary

Split account aggregation, relations, operations, profile, and asset helpers into dedicated modules.

## Goal

Remove account-centric helper sprawl from `data.ts` and prepare `/me` plus account routes for a clear domain boundary.

## Milestone

- milestone file: none
- slice name: `api account domain split`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add `domains/account/routes.ts`
  - add `domains/account/schemas.ts`
  - add `domains/account/profile.ts`
  - add `domains/account/relations.ts`
  - add `domains/account/assets.ts`
  - add `domains/account/operations.ts`
  - add `domains/account/current-user.ts`
  - move account route and helper logic from `app.ts` and `data.ts`
- Out of scope:
  - changing account response shape

## Ownership

- owned files:
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - `apps/api/src/domains/account/**`
  - `tasks/cards/active/0209-api-account-domain-split.md`

## Dependencies

- depends on:
  - `0201-api-http-infra-extraction.md`
  - `0206-api-settings-and-ops-split.md`
- blocked by:
  - none
- integration notes:
  - use `current-user.ts` as the only cross-subdomain aggregation layer

## Affected Paths

- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- `apps/api/src/domains/account/**`

## Verification

- slice gate:
  - account route and helper logic are separated and `/me` remains behavior-compatible
- generation needed:
  - none
- final verifier handoff:
  - include API verification command and touched account endpoints

## Acceptance

- [x] account routes are registered from `domains/account/routes.ts`
- [x] account schemas are moved out of `app.ts`
- [x] account helper clusters are moved out of `data.ts`
- [x] `pnpm verify:api` run

## Notes

- 2026-04-12: extracted account helpers into `domains/account/{assets,operations,relations,current-user,profile}.ts`
- 2026-04-12: moved `/me` and `/account/*` routes into `domains/account/routes.ts`
- 2026-04-12: `pnpm -s exec tsc -p tsconfig.json --noEmit`
- 2026-04-12: `pnpm verify:api`
- 2026-04-12: `pnpm verify`
