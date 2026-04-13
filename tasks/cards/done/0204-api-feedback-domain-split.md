# Card 0204 API Feedback Domain Split

## Summary

Split feedback tickets and support bootstrap logic into dedicated feedback-domain modules.

## Goal

Separate feedback routes, schemas, ticket workflow helpers, and support bootstrap helpers from the monolithic API files.

## Milestone

- milestone file: none
- slice name: `api feedback domain split`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add `domains/feedback/routes.ts`
  - add `domains/feedback/schemas.ts`
  - add `domains/feedback/tickets.ts`
  - add `domains/feedback/support.ts`
  - move feedback routes and helpers from `app.ts` and `data.ts`
- Out of scope:
  - changes to feedback business semantics

## Ownership

- owned files:
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - `apps/api/src/domains/feedback/**`
  - `tasks/cards/active/0204-api-feedback-domain-split.md`

## Dependencies

- depends on:
  - `0201-api-http-infra-extraction.md`
- blocked by:
  - none
- integration notes:
  - keep thread linkage explicit and avoid importing message route code

## Affected Paths

- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- `apps/api/src/domains/feedback/**`

## Verification

- slice gate:
  - feedback route and helper logic are separated without changing existing responses
- generation needed:
  - none
- final verifier handoff:
  - include API verification command and feedback endpoints touched

## Acceptance

- [x] feedback routes are registered from `domains/feedback/routes.ts`
- [x] feedback schemas are moved out of `app.ts`
- [x] feedback ticket and support helpers are moved out of `data.ts`
- [x] `pnpm verify:api` run

## Verification Notes

- 2026-04-12: `pnpm -s exec tsc -p tsconfig.json --noEmit`
- 2026-04-12: `pnpm verify:api`
- 2026-04-12: `pnpm verify`
