# Card 0435 API Trace Helper Adoption

## Summary

Adopt the shared route trace helper in simple API error paths.

## Goal

Replace remaining simple `c.get("traceId")` lookups in public, account identity, and upload asset routes with `getRouteTraceId` or existing route context loading so trace handling stays consistent across reusable API domains.

## Milestone

- milestone file: none
- slice name: `api trace helper adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - use `getRouteTraceId` in public asset routes
  - use `getRouteTraceId` in account identity unauthorized checks
  - use existing `loadRouteUserState` trace output in upload asset routes
  - focused API/typecheck verification
- Out of scope:
  - auth route body parsing rewrite
  - response envelope changes
  - trace ID generation policy changes

## Ownership

- owned files:
  - `apps/api/src/domains/public/routes.ts`
  - `apps/api/src/domains/account/routes.identity.ts`
  - `apps/api/src/domains/uploads/routes.ts`
  - `tasks/cards/active/0435-api-trace-helper-adoption.md`
- allowed generated outputs:
  - none
- forbidden files:
  - shared contracts unless behavior changes
  - generated files

## Dependencies

- depends on:
  - `apps/api/src/http/route-context.ts`
- blocked by:
  - none
- integration notes:
  - This is helper adoption only; trace IDs in errors and SVG responses must stay unchanged.

## Affected Paths

- `apps/api/src/domains/public/routes.ts`
- `apps/api/src/domains/account/routes.identity.ts`
- `apps/api/src/domains/uploads/routes.ts`

## Related Specs

- `docs/modules/api.md`
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
  - `pnpm verify:api`
  - `pnpm typecheck`
- generation needed:
  - none
- final verifier handoff:
  - public SVG and upload asset not-found paths should keep trace-aware responses.

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
