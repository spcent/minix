# Card 0201 API HTTP Infra Extraction

## Summary

Extract shared HTTP, trace, auth-header, and CORS helpers from the oversized API entry file.

## Goal

Reduce [apps/api/src/app.ts](/Users/bingrong.yan/projects/birdor/minix/apps/api/src/app.ts) to app assembly responsibilities by moving reusable request/response infrastructure into dedicated modules.

## Milestone

- milestone file: none
- slice name: `api http infra extraction`

## Priority

- priority: `P0`

## Scope

- In scope:
  - extract trace-id helpers and response helpers
  - extract JSON body and query parsing helpers
  - extract bearer token and unauthorized response helpers
  - extract CORS origin parsing and preflight/header application helpers
  - keep API behavior unchanged while shrinking `app.ts`
- Out of scope:
  - splitting business routes by domain
  - changing auth, payment, upload, or content behavior

## Ownership

- owned files:
  - `apps/api/src/app.ts`
  - `apps/api/src/http/**`
  - `tasks/cards/active/0201-api-http-infra-extraction.md`
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/**`
  - generated host manifests and shells

## Dependencies

- depends on:
  - none
- blocked by:
  - none
- integration notes:
  - keep helper signatures simple so later route-domain cards can reuse them directly

## Affected Paths

- `apps/api/src/app.ts`
- `apps/api/src/http/**`
- `tasks/cards/active/0201-api-http-infra-extraction.md`

## Related Specs

- `docs/ARCHITECTURE.md`
- `docs/AGENT_GUIDE.md`

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
  - shared HTTP helpers live outside `app.ts` and API behavior remains unchanged
- generation needed:
  - none
- final verifier handoff:
  - include scoped API verification command and whether behavior-diff checks were needed

## Acceptance

- [x] `apps/api/src/http/response.ts` owns generic response and trace helpers
- [x] `apps/api/src/http/parsing.ts` owns body/query validation helpers
- [x] `apps/api/src/http/auth.ts` owns bearer-token and unauthorized helpers
- [x] `apps/api/src/http/cors.ts` owns configured-origin and preflight/header logic
- [x] `apps/api/src/app.ts` no longer defines those helpers inline
- [x] `pnpm verify:api` run

## Verification Record

- `pnpm verify:api`
- `pnpm verify`
