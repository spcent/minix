# Card 0205 API Messages Domain Split

## Summary

Split notifications, threads, and touchpoint delivery helpers into dedicated messages-domain modules.

## Goal

Decompose the message surface so route registration, schemas, thread logic, and delivery helpers stop living in the giant API files.

## Milestone

- milestone file: none
- slice name: `api messages domain split`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add `domains/messages/routes.ts`
  - add `domains/messages/schemas.ts`
  - add `domains/messages/notifications.ts`
  - add `domains/messages/threads.ts`
  - add `domains/messages/touchpoints.ts`
  - migrate message routes and helpers from `app.ts` and `data.ts`
- Out of scope:
  - changing messaging behavior or provider semantics

## Ownership

- owned files:
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - `apps/api/src/domains/messages/**`
  - `tasks/cards/active/0205-api-messages-domain-split.md`

## Dependencies

- depends on:
  - `0201-api-http-infra-extraction.md`
  - `0204-api-feedback-domain-split.md`
- blocked by:
  - none
- integration notes:
  - keep delivery helpers separate from thread CRUD to reduce future coupling

## Affected Paths

- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- `apps/api/src/domains/messages/**`

## Verification

- slice gate:
  - message routes are registered through a dedicated module and thread/delivery helpers are split by concern
- generation needed:
  - none
- final verifier handoff:
  - include API verification command and message endpoints touched

## Acceptance

- [x] message routes are registered from `domains/messages/routes.ts`
- [x] message schemas are moved out of `app.ts`
- [x] notification, thread, and touchpoint helpers are moved out of `data.ts`
- [x] `pnpm verify:api` run

## Verification Notes

- 2026-04-12: `pnpm -s exec tsc -p tsconfig.json --noEmit`
- 2026-04-12: `pnpm verify:api`
- 2026-04-12: `pnpm verify`
