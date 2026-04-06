# M001 Card 0031 Auth Session Contract Hardening

## Summary

Freeze and implement the `v1.0` auth, session-expiry, logout, and protected-request contract in contracts and core runtime.

## Goal

Make auth and request behavior predictable enough for release so hosts do not rely on ad hoc session clearing, mock assumptions, or inconsistent unauthorized handling.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `auth and session contract hardening`

## Scope

- In scope:
  - narrow auth contract changes needed for token lifecycle and recovery semantics
  - define how `accessToken`, `refreshToken`, `expiresAt`, and logout are treated in `v1.0`
  - harden core auth, session, and request runtime behavior for expired or unauthorized sessions
  - update or add focused tests for restore, expiry, logout, and unauthorized request mapping
- Out of scope:
  - host UI polish
  - platform adapter parity work outside what contract tests require
  - environment/bootstrap selection

## Ownership

- owned files:
  - `packages/contracts/src/api/auth.ts`
  - `packages/core/src/runtime/auth.ts`
  - `packages/core/src/runtime/session.ts`
  - `packages/core/src/runtime/request.ts`
  - related tests under `packages/core/src/runtime/*.test.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - `apps/**`
  - `packages/features/**`
  - `packages/platform-*/**`
  - `packages/tooling/**`

## Dependencies

- depends on:
  - `0030-M001-release-scope-freeze.md`
- blocked by:
  - final release decision on whether token refresh is supported in `v1.0`
- integration notes:
  - downstream controller and adapter cards should not redefine auth semantics locally

## Affected Paths

- `packages/contracts/src/api/auth.ts`
- `packages/core/src/runtime/auth.ts`
- `packages/core/src/runtime/session.ts`
- `packages/core/src/runtime/request.ts`
- `packages/core/src/error/*`
- `packages/core/src/types/*`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`
- `tasks/milestones/M001-v1.0-release-readiness.md`

## Interface Notes

- contract changes allowed:
  - narrow auth payload and session lifecycle changes only
- store shape changes allowed:
  - none
- controller action changes allowed:
  - none
- route param changes allowed:
  - none

## Verification

- slice gate:
  - `pnpm verify:feature auth`
- generation needed:
  - none
- final verifier handoff:
  - provide a written summary of final auth lifecycle semantics for host and adapter cards

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
