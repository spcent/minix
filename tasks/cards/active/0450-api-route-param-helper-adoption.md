# Card 0450 API Route Param Helper Adoption

## Summary

Adopt shared API route parameter access.

## Goal

Remove remaining direct route parameter reads from API domain handlers and keep route context access behind the shared helper layer.

## Milestone

- milestone file: none
- slice name: `api route param helper adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - add a small route param helper to `http/route-context`
  - adopt it in public asset routes and upload asset routes
  - focused API/typecheck verification
- Out of scope:
  - route shape or path changes
  - generated manifest changes
  - request/response contract changes

## Ownership

- owned files:
  - `apps/api/src/http/route-context.ts`
  - `apps/api/src/domains/public/routes.ts`
  - `apps/api/src/domains/uploads/routes.ts`
  - `tasks/cards/active/0450-api-route-param-helper-adoption.md`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host registries
  - generated manifests

## Dependencies

- depends on:
  - `tasks/cards/active/0433-api-route-parsing-helper-adoption.md`
- blocked by:
  - none
- integration notes:
  - Keep missing or invalid asset parameters on existing not-found paths.

## Affected Paths

- `apps/api/src/http/route-context.ts`
- `apps/api/src/domains/public/routes.ts`
- `apps/api/src/domains/uploads/routes.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `specs/dependency-rules.yaml`

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
  - `pnpm typecheck`
  - `pnpm verify:api`
- generation needed:
  - none
- final verifier handoff:
  - Public sample assets, share posters, upload asset download, and upload thumbnail routes should keep the same route behavior.

## Implementation Notes

- Added `getRouteParam` to the shared API route context helpers.
- Adopted it for public sample asset routes, share poster routes, upload asset download, and upload thumbnail routes.
- Confirmed direct route param reads are now contained inside the route context helper.

## Verification Notes

- Ran `pnpm typecheck`.
- Ran `pnpm verify:api`.

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
