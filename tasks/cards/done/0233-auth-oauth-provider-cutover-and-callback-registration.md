# Card 0233 Auth OAuth Provider Cutover And Callback Registration

## Summary

Move OAuth authorization and callback handling from explicit sample posture to a production-ready provider integration plan.

## Goal

Make OAuth login and bind flows production-capable with validated provider credentials, callback registration, and host-visible failure guidance.

## Milestone

- milestone file: none
- slice name: `auth oauth provider cutover and callback registration`

## Priority

- priority: `P0`

## Scope

- In scope:
  - integrate a real OAuth provider configuration path
  - validate callback-domain registration and provider-token verification assumptions
  - remove sample authorization-url posture from production host copy
  - document operator-owned callback registration and secret handling
- Out of scope:
  - social-provider growth experiments beyond the selected production provider set

## Ownership

- owned files:
  - `packages/contracts/src/api/auth.ts`
  - `packages/features/auth/src/**`
  - `apps/api/src/domains/auth/**`
  - `docs/**`
- allowed generated outputs:
  - none unless host auth manifests change
- forbidden files:
  - committed OAuth client secrets

## Dependencies

- depends on:
  - `tasks/cards/done/0224-auth-provider-production-readiness.md`
- blocked by:
  - selected OAuth provider credentials and callback-domain ownership
- integration notes:
  - keep OAuth callback on the current login or bind page; do not add a separate callback-only host route unless the provider contract forces it

## Affected Paths

- `packages/contracts/src/api/auth.ts`
- `packages/features/auth/src/controller/index.ts`
- `packages/features/auth/src/model/index.ts`
- `apps/api/src/domains/auth/routes.ts`
- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`

## Interface Notes

- contract changes allowed:
  - yes, for provider references, callback posture, and error semantics
- store shape changes allowed:
  - yes, in auth OAuth state only
- controller action changes allowed:
  - yes
- route param changes allowed:
  - only if a provider requires callback-path metadata changes

## Verification

- slice gate:
  - OAuth authorize and callback no longer depend on sample URLs in the production path
- generation needed:
  - none unless host auth surfaces change
- final verifier handoff:
  - include provider selection, callback registration checklist, and host posture decision

## Acceptance

- [x] real OAuth provider configuration replaces sample authorization posture in production mode
- [x] callback-domain registration requirements are documented and validated
- [x] OAuth provider failures map to normalized auth errors and host-visible guidance
- [x] host login and bind surfaces remain explicit about repo-owned versus operator-owned setup
- [x] `pnpm verify` run if code changes
