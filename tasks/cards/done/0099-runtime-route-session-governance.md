# Card 0099 Runtime Route Session Governance

## Summary

Promote route guard and session recovery from feature-local behavior into a unified runtime policy.

## Goal

Guarantee consistent login interception, redirectTarget propagation, forced re-login, silent refresh recovery, and expired-session UI across H5 and WeChat hosts.

## Milestone

- milestone file: none
- slice name: `runtime route session governance`

## Priority

- priority: `P0`

## Scope

- In scope:
  - enable a shared route-guard runtime policy instead of per-feature ad hoc checks
  - support generic `redirectTarget` for every protected route, not a fixed subset
  - add forced re-login state and user-visible recovery behavior
  - preserve source route and route params through login, refresh, and deep-link recovery
  - add tests for unauthorized entry, expired session, silent refresh success, silent refresh failure, and forced re-login
- Out of scope:
  - provider credential login implementation, covered by `0097`

## Ownership

- owned files:
  - `packages/contracts/src/api/auth.ts`
  - `packages/contracts/src/routes.ts`
  - `packages/core/src/**`
  - `packages/features/auth/src/**`
  - `apps/host-h5/src/manifest/page-definitions.ts`
  - `apps/host-wechat/src/manifest/page-definitions.ts`
  - related runtime and host tests
- allowed generated outputs:
  - regenerated manifests and shells only
- forbidden files:
  - generated host files as source edits

## Dependencies

- depends on:
  - `0095-route-recovery-and-deep-link-validation.md`
- blocked by:
  - none
- integration notes:
  - route guard policy must remain manifest- and registry-driven

## Affected Paths

- `packages/core/src/runtime/**`
- `packages/core/src/router/**`
- `packages/features/auth/src/controller/index.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/ARCHITECTURE.md`
- `docs/BACKEND_CONTRACT.md`

## Interface Notes

- contract changes allowed:
  - yes, for redirect target and auth recovery semantics
- store shape changes allowed:
  - yes, for auth recovery and forced re-login state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for generic redirect target payloads

## Verification

- slice gate:
  - every protected host route follows the same guard and recovery behavior
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat shell routes change
- final verifier handoff:
  - verify guard behavior in both hosts

## Acceptance

- [x] route guard is enabled through shared runtime policy
- [x] `redirectTarget` supports arbitrary registered route ids and params
- [x] forced re-login has a first-class auth status and UI recovery path
- [x] expired-session and silent-refresh behavior is consistent across hosts
- [x] tests cover guarded route recovery matrix
- [x] `pnpm verify` run
