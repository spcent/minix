# Card 0439 API Auth Parse Route Body Adoption

## Summary

Adopt route body parsing helpers in auth routes.

## Goal

Reduce repeated `parseJsonBody(c.req.raw, schema, traceId)` calls in auth routes so request parsing follows the same route-context helper surface used by newer API domains.

## Milestone

- milestone file: none
- slice name: `api auth parse route body adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - adopt `parseRouteBody` in auth route handlers
  - keep `getRouteTraceId` where the handler still needs trace ids for logging or normalized errors
  - focused API/typecheck verification
- Out of scope:
  - auth behavior changes
  - schema changes
  - response envelope changes

## Ownership

- owned files:
  - `apps/api/src/domains/auth/routes.ts`
  - `tasks/cards/active/0439-api-auth-parse-route-body-adoption.md`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host registries
  - generated manifests

## Dependencies

- depends on:
  - `tasks/cards/active/0437-api-auth-trace-helper-adoption.md`
- blocked by:
  - none
- integration notes:
  - Use `apps/api/src/http/route-context.ts`; do not introduce auth-local parsing helpers.

## Affected Paths

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
  - Auth validation errors should preserve normalized error envelopes and trace ids.

## Implementation Notes

- Adopted `parseRouteBody` for all auth route body parsing sites.
- Removed the direct `parseJsonBody` import from auth routes.
- Kept `getRouteTraceId` in handlers that still need trace ids for logging, rate limits, or normalized errors.

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
