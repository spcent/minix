# Card 0448 API Bearer Session Helper Adoption

## Summary

Centralize API bearer token session resolution.

## Goal

Remove duplicated bearer-token-to-session lookup code across the API entry middleware, current-user route, and auth optional session flows.

## Milestone

- milestone file: none
- slice name: `api bearer session helper adoption`

## Priority

- priority: `P2`

## Scope

- In scope:
  - add a small shared HTTP auth helper for bearer session resolution
  - adopt the helper in `requireSession`, `/me`, and auth routes that probe an optional session
  - preserve existing unauthorized and optional-session behavior
  - focused API/typecheck verification
- Out of scope:
  - session store behavior changes
  - auth workflow or provider posture changes
  - request/response contract changes

## Ownership

- owned files:
  - `apps/api/src/http/auth.ts`
  - `apps/api/src/app.ts`
  - `apps/api/src/domains/account/routes.identity.ts`
  - `apps/api/src/domains/auth/routes.ts`
  - `tasks/cards/active/0448-api-bearer-session-helper-adoption.md`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host registries
  - generated manifests

## Dependencies

- depends on:
  - `tasks/cards/active/0447-api-auth-client-context-adoption.md`
- blocked by:
  - none
- integration notes:
  - OAuth bind state must keep its deferred-owner guard when an authorization header is present but not backed by a valid session.

## Affected Paths

- `apps/api/src/http/auth.ts`
- `apps/api/src/app.ts`
- `apps/api/src/domains/account/routes.identity.ts`
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
  - Missing or invalid bearer tokens should still return the canonical unauthorized response on protected routes.

## Implementation Notes

- Added `resolveBearerSession` to centralize bearer token parsing and access-token session lookup.
- Adopted the helper in `requireSession`, `/me`, phone verification account-security probing, and OAuth bind owner resolution.
- Kept logout on raw bearer token parsing because revoke semantics need the access token itself.

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
