# Card 0203 API Upload Domain Split

## Summary

Split the upload pipeline into its own route and domain helper modules.

## Goal

Move upload session, chunk, completion, attach, retry, cancel, and asset-read logic out of the two monolithic API files.

## Milestone

- milestone file: none
- slice name: `api upload domain split`

## Priority

- priority: `P0`

## Scope

- In scope:
  - add `domains/uploads/routes.ts`
  - add `domains/uploads/schemas.ts`
  - add `domains/uploads/pipeline.ts`
  - move upload route handling and pipeline helpers from `app.ts` and `data.ts`
- Out of scope:
  - changing upload governance semantics
  - changing storage persistence model

## Ownership

- owned files:
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - `apps/api/src/domains/uploads/**`
  - `tasks/cards/active/0203-api-upload-domain-split.md`
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
  - keep upload helper names stable so route migration is mostly mechanical

## Affected Paths

- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- `apps/api/src/domains/uploads/**`

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
  - upload routes and helpers are fully separated by domain without behavior change
- generation needed:
  - none
- final verifier handoff:
  - include API verification commands and touched endpoints

## Acceptance

- [x] upload routes are registered from `domains/uploads/routes.ts`
- [x] upload schemas are moved out of `app.ts`
- [x] upload pipeline helpers are moved out of `data.ts`
- [x] `app.ts` no longer contains inline upload route definitions
- [x] `pnpm verify:api` run

## Verification Notes

- 2026-04-12: `pnpm verify:api`
- 2026-04-12: `pnpm verify`
