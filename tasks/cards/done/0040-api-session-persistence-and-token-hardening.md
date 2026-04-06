# Card 0040 API Session Persistence And Token Hardening

## Summary

Replace the API's demo-grade in-memory session handling with persistent session state, refresh-token lifecycle rules, and explicit logout or revocation behavior.

## Goal

Make auth behavior durable and predictable across restarts so `refreshToken` and protected sample flows behave like a real backend instead of a local demo stub.

## Milestone

- milestone file: none
- slice name: `api auth persistence`

## Scope

- In scope:
  - persist access and refresh session state outside process memory
  - define refresh rotation, expiry, and revocation rules
  - make `/auth/logout` meaningful for stored sessions
  - keep `/auth/login` and `/auth/refresh` responses aligned with `packages/contracts`
- Out of scope:
  - third-party identity provider integration
  - role-based authorization
  - frontend controller changes outside compatibility fixes

## Ownership

- owned files:
  - `apps/api/**`
  - `docs/BACKEND_CONTRACT.md` if auth semantics change
- allowed generated outputs:
  - lockfile updates
- forbidden files:
  - `packages/features/**`
  - `apps/*/src/manifest/**`

## Dependencies

- depends on:
  - `apps/api/**`
  - storage binding work from `0039-api-cloudflare-runtime-and-store-bindings.md`
- blocked by:
  - persistent storage choice
- integration notes:
  - keep client-visible error codes stable for expired, invalid, and revoked sessions

## Affected Paths

- `apps/api/**`
- `docs/BACKEND_CONTRACT.md`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`
- `docs/BACKEND_CONTRACT.md`

## Interface Notes

- contract changes allowed:
  - auth error semantics only if documented
- store shape changes allowed:
  - API-internal store contracts only
- controller action changes allowed:
  - none
- route param changes allowed:
  - none

## Verification

- slice gate:
  - auth route tests for login, refresh, expiry, logout, and revoked refresh tokens
- generation needed:
  - none
- final verifier handoff:
  - prove sessions survive API restarts and revoked refresh tokens can no longer mint access tokens

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
