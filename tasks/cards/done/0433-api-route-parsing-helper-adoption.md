# Card 0433 API Route Parsing Helper Adoption

## Summary

Adopt shared API route parsing helpers in remaining non-auth domain routes.

## Goal

Replace direct `parseQuery(new URL(...), c.get("traceId"))` and `parseJsonBody(c.req.raw, ..., traceId)` calls with `parseRouteQuery` and `parseRouteBody` so route parsing stays consistent and easier to reuse across product-matrix API domains.

## Milestone

- milestone file: none
- slice name: `api route parsing helper adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - adopt route parsing helpers in items, ops, settings, and content routes
  - keep existing `traceId` locals where downstream error responses need them
  - focused API/typecheck verification
- Out of scope:
  - changing validation schemas
  - changing response envelopes
  - broad auth route rewrite

## Ownership

- owned files:
  - `apps/api/src/domains/items/routes.ts`
  - `apps/api/src/domains/ops/routes.ts`
  - `apps/api/src/domains/settings/routes.ts`
  - `apps/api/src/domains/content/routes.ts`
  - `tasks/cards/active/0433-api-route-parsing-helper-adoption.md`
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
  - This is helper adoption only; parsing behavior and error shapes must stay unchanged.

## Affected Paths

- `apps/api/src/domains/items/routes.ts`
- `apps/api/src/domains/ops/routes.ts`
- `apps/api/src/domains/settings/routes.ts`
- `apps/api/src/domains/content/routes.ts`

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
  - validation failure responses should keep the same trace-aware parsing behavior.

## Implementation Notes

- Replaced direct query parsing with `parseRouteQuery` in items, ops, and content routes.
- Replaced direct JSON body parsing with `parseRouteBody` in ops, settings, and content routes.
- Kept explicit `traceId` locals only where downstream `jsonError` calls still need the same trace value.

## Verification Notes

- Ran `pnpm verify:api`.
- Ran `pnpm typecheck`.

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
