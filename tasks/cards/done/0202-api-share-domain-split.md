# Card 0202 API Share Domain Split

## Summary

Split the share domain out of the monolithic API files as the first business-domain route slice.

## Goal

Move share routes, schemas, and attribution helpers into a dedicated domain module so later route splits can follow the same pattern.

## Milestone

- milestone file: none
- slice name: `api share domain split`

## Priority

- priority: `P0`

## Scope

- In scope:
  - add `domains/share/routes.ts`
  - add `domains/share/schemas.ts`
  - add `domains/share/attribution.ts`
  - move share prepare, resolve, return recognition, and attribution report logic out of `app.ts` and `data.ts`
- Out of scope:
  - changing share business behavior
  - implementing new growth features

## Ownership

- owned files:
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - `apps/api/src/domains/share/**`
  - `tasks/cards/active/0202-api-share-domain-split.md`
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/**`

## Dependencies

- depends on:
  - `0201-api-http-infra-extraction.md`
- blocked by:
  - none
- integration notes:
  - use this slice to define the route-module shape for later domain cards

## Affected Paths

- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- `apps/api/src/domains/share/**`

## Related Specs

- `docs/BACKEND_CONTRACT.md`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - none
- controller action changes allowed:
  - none
- route param changes allowed:
  - none

## Verification

- slice gate:
  - share routes are registered through a dedicated module and all share helpers leave `data.ts`
- generation needed:
  - none
- final verifier handoff:
  - include `verify:api` result and impacted route list

## Acceptance

- [x] share routes are registered from `domains/share/routes.ts`
- [x] share schemas are moved out of `app.ts`
- [x] share attribution helpers are moved out of `data.ts`
- [x] `app.ts` no longer contains inline share route definitions
- [x] `pnpm verify:api` run

## Verification Record

- `pnpm verify:api`
- `pnpm verify`
