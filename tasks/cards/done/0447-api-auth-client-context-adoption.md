# Card 0447 API Auth Client Context Adoption

## Summary

Adopt shared API client context parsing in auth routes.

## Goal

Remove duplicated `x-forwarded-for` parsing from auth route handlers and keep client identity resolution aligned with rate-limit and client-context helpers.

## Milestone

- milestone file: none
- slice name: `api auth client context adoption`

## Priority

- priority: `P2`

## Scope

- In scope:
  - use shared route client context loading for auth verification, login, and refresh handlers
  - preserve existing auth rate-limit, risk, and audit call shapes
  - focused API/typecheck verification
- Out of scope:
  - auth workflow behavior redesign
  - provider posture changes
  - request/response contract changes

## Ownership

- owned files:
  - `apps/api/src/domains/auth/routes.ts`
  - `tasks/cards/active/0447-api-auth-client-context-adoption.md`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host registries
  - generated manifests

## Dependencies

- depends on:
  - `tasks/cards/active/0435-api-trace-helper-adoption.md`
  - `tasks/cards/active/0439-api-auth-parse-route-body-adoption.md`
- blocked by:
  - none
- integration notes:
  - Keep normal business failures on existing response paths.

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
  - `pnpm typecheck`
  - `pnpm verify:api`
- generation needed:
  - none
- final verifier handoff:
  - Auth client id resolution should continue to support `x-forwarded-for` while also honoring the canonical resolver behavior.

## Implementation Notes

- Added shared client context loading to auth verification, login, and refresh handlers.
- Reused the canonical `resolveClientId` behavior instead of manually parsing `x-forwarded-for`.

## Verification Notes

- Ran `pnpm typecheck`.
- Ran `pnpm verify:api`.
- `pnpm integration:api` was listed initially but is not a repository script; replaced it with `pnpm verify:api`.

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
