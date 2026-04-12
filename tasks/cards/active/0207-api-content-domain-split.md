# Card 0207 API Content Domain Split

## Summary

Split novels, managed content, feed, and search helpers into a dedicated content-domain module set.

## Goal

Remove content-heavy route and helper logic from the monolithic API files while keeping cross-surface behavior unchanged.

## Milestone

- milestone file: none
- slice name: `api content domain split`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add `domains/content/routes.ts`
  - add `domains/content/schemas.ts`
  - add `domains/content/novels.ts`
  - add `domains/content/managed-content.ts`
  - add `domains/content/feed.ts`
  - add `domains/content/search.ts`
  - move content routes and helpers from `app.ts` and `data.ts`
- Out of scope:
  - changing content lifecycle semantics
  - changing sample content data

## Ownership

- owned files:
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - `apps/api/src/domains/content/**`
  - `tasks/cards/active/0207-api-content-domain-split.md`

## Dependencies

- depends on:
  - `0201-api-http-infra-extraction.md`
  - `0206-api-settings-and-ops-split.md`
- blocked by:
  - none
- integration notes:
  - keep search separate from feed so domain boundaries stay explicit

## Affected Paths

- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- `apps/api/src/domains/content/**`

## Verification

- slice gate:
  - content routes and helpers are fully moved into content-domain modules
- generation needed:
  - none
- final verifier handoff:
  - include API verification command and touched content endpoints

## Acceptance

- [x] content routes are registered from `domains/content/routes.ts`
- [x] content schemas are moved out of `app.ts`
- [x] novels, managed-content, feed, and search helpers are moved out of `data.ts`
- [x] `pnpm verify:api` run

## Notes

- `app.ts` now delegates content HTTP registration to `domains/content/routes.ts` and no longer defines content request schemas inline.
- `data.ts` was reduced to seed and cross-domain aggregation duties; novels, managed content, feed, and search helpers now live under `domains/content/*`.
- 2026-04-12: `pnpm -s exec tsc -p tsconfig.json --noEmit`
- 2026-04-12: `pnpm verify:api`
