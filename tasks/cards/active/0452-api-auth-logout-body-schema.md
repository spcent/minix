# Card 0452 API Auth Logout Body Schema

## Summary

Normalize auth logout body parsing through schemas.

## Goal

Remove the remaining hand-written API request JSON parsing while preserving logout's optional-body behavior.

## Milestone

- milestone file: none
- slice name: `api auth logout body schema`

## Priority

- priority: `P3`

## Scope

- In scope:
  - add a tolerant logout request schema
  - parse `/auth/logout` through `parseRouteBody`
  - keep malformed or missing logout body behavior non-blocking
  - focused API/typecheck verification
- Out of scope:
  - logout response contract changes
  - revoke-session behavior changes
  - auth session lifecycle redesign

## Ownership

- owned files:
  - `apps/api/src/domains/auth/schemas.ts`
  - `apps/api/src/domains/auth/routes.ts`
  - `tasks/cards/active/0452-api-auth-logout-body-schema.md`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host registries
  - generated manifests

## Dependencies

- depends on:
  - `tasks/cards/active/0439-api-auth-parse-route-body-adoption.md`
- blocked by:
  - none
- integration notes:
  - The schema should tolerate absent or malformed bodies so logout can still revoke by access token.

## Affected Paths

- `apps/api/src/domains/auth/schemas.ts`
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
  - Logout should still succeed when the request only carries an access token and no valid JSON body.

## Implementation Notes

- Added a tolerant `logoutRequestSchema` with `refreshToken` support and fallback `{}` behavior.
- Parsed `/auth/logout` through `parseRouteBody` while preserving access-token-only logout.
- Confirmed API source no longer has direct `c.req.json()` calls.

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
