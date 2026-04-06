# M001 Card 0044 API Auth Security And Abuse Controls

## Summary

Add release-grade auth hardening around login, refresh, and logout so the shipped API is not only functionally correct but also defensible under repeated or hostile traffic.

## Goal

Reduce obvious production risks in the new Hono API path before `v1.0`, especially around brute-force login attempts, refresh abuse, and weak secret handling assumptions.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `api auth security`

## Scope

- In scope:
  - define required secret and auth-related environment configuration for the API runtime
  - add login and refresh abuse controls such as rate limiting or equivalent throttling
  - make session and refresh token handling auditable and explicit in docs
  - normalize auth failure logging or counters without leaking token material
- Out of scope:
  - full user account system redesign
  - third-party identity providers
  - payment or billing security

## Ownership

- owned files:
  - `apps/api/**`
  - `docs/BACKEND_CONTRACT.md`
  - relevant docs
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/features/**`
  - `apps/host-*/src/**`
  - `apps/novel-*/src/**`

## Dependencies

- depends on:
  - `0043-M001-cloudflare-remote-api-deploy-and-env-promotion.md`
- blocked by:
  - final decision on where auth secrets and rate-limit state live in Cloudflare runtime
- integration notes:
  - keep local development ergonomic while making production requirements explicit

## Affected Paths

- `apps/api/**`
- `docs/BACKEND_CONTRACT.md`
- `README.md`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`
- `tasks/milestones/M001-v1.0-release-readiness.md`

## Interface Notes

- contract changes allowed:
  - narrow auth error documentation changes only
- store shape changes allowed:
  - API-internal auth metadata only
- controller action changes allowed:
  - none
- route param changes allowed:
  - none

## Verification

- slice gate:
  - API tests covering login, refresh rotation, and abuse-control behavior
- generation needed:
  - none
- final verifier handoff:
  - document required secrets and expected behavior for throttled or rejected auth attempts

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
