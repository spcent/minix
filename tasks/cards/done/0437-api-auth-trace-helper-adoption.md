# Card 0437 API Auth Trace Helper Adoption

## Summary

Adopt API trace helper usage in auth and session guard paths.

## Goal

Reduce direct `Context` variable lookups in auth routes and app-level session guards so trace handling stays centralized and route code remains easier to reuse across API domains.

## Milestone

- milestone file: none
- slice name: `api auth trace helper adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - adopt `getRouteTraceId` in auth route handlers
  - adopt `getRouteTraceId` in app-level session guard unauthorized responses
  - focused API/typecheck verification
- Out of scope:
  - auth behavior changes
  - response envelope changes
  - provider posture changes

## Ownership

- owned files:
  - `apps/api/src/app.ts`
  - `apps/api/src/domains/auth/routes.ts`
  - `tasks/cards/active/0437-api-auth-trace-helper-adoption.md`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host registries
  - generated manifests

## Dependencies

- depends on:
  - `tasks/cards/active/0435-api-trace-helper-adoption.md`
- blocked by:
  - none
- integration notes:
  - Keep helper usage in `apps/api/src/http/route-context.ts`; do not introduce domain-local trace wrappers.

## Affected Paths

- `apps/api/src/app.ts`
- `apps/api/src/domains/auth/routes.ts`

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
  - `pnpm verify:api`
  - `pnpm typecheck`
- generation needed:
  - none
- final verifier handoff:
  - auth error responses should continue echoing normalized trace ids.

## Implementation Notes

- Adopted `getRouteTraceId` in app-level session guard unauthorized responses.
- Adopted `getRouteTraceId` in auth route handlers that pass trace ids into body parsing, rate limit, and normalized error responses.
- Kept auth parsing and provider workflow behavior unchanged.

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
