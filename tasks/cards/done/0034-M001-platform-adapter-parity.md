# M001 Card 0034 Platform Adapter Parity

## Summary

Bring H5 and WeChat platform adapters up to the frozen `v1.0` contract level for request, auth, router, storage, and UI behavior.

## Goal

Make platform differences explicit and intentional instead of relying on H5 no-op implementations or host-specific fallbacks.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `platform adapter parity`

## Scope

- In scope:
  - align request timeout and error behavior where the shared runtime expects parity
  - upgrade H5 UI adapter from no-op behavior where release UX depends on real feedback
  - ensure auth, router, storage, and UI contract tests exist for supported `v1.0` semantics
  - document intentional adapter differences if they remain
- Out of scope:
  - host rendering changes
  - controller alignment inside feature packages
  - environment bootstrap behavior

## Ownership

- owned files:
  - `packages/platform-h5/**`
  - `packages/platform-wechat/**`
  - adapter tests within those packages
- allowed generated outputs:
  - none
- forbidden files:
  - `apps/**`
  - `packages/features/**`
  - `packages/tooling/**`
  - `packages/contracts/**`
  - `packages/core/src/runtime/**`

## Dependencies

- depends on:
  - `0031-M001-auth-session-contract-hardening.md`
- blocked by:
  - final adapter behavior expected by the hardened runtime contract
- integration notes:
  - if adapter limitations remain, report them back to the milestone rather than hiding them in host code

## Affected Paths

- `packages/platform-h5/*`
- `packages/platform-wechat/*`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`
- `tasks/milestones/M001-v1.0-release-readiness.md`

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
  - targeted adapter contract tests
- generation needed:
  - none
- final verifier handoff:
  - summarize remaining intentional H5 vs WeChat differences, if any

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
