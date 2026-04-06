# M001 Card 0036 Release Verification And CI Gates

## Summary

Add release-grade verification so `v1.0` is gated by main-flow behavior, not only static guards and unit tests.

## Goal

Ensure the repo has a repeatable release gate that catches broken main flows, broken environment wiring, and critical regressions before tagging `v1.0`.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `release verification and CI gates`

## Scope

- In scope:
  - define the minimum `v1.0` release gate beyond `pnpm verify`
  - add or wire targeted smoke/e2e checks for official host flows
  - integrate new checks into repo scripts and CI if available
  - document what counts as pass/fail for release readiness
- Out of scope:
  - large test-framework migration
  - visual regression coverage for every route
  - broad product-specific verification beyond the milestone’s official release paths

## Ownership

- owned files:
  - `package.json`
  - `scripts/**`
  - `packages/testkit/**`
  - optional `.github/workflows/**`
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/contracts/**`
  - `packages/core/**`
  - `packages/features/**`
  - `packages/platform-*/**`
  - `apps/**`

## Dependencies

- depends on:
  - `0031-M001-auth-session-contract-hardening.md`
- blocked by:
  - final decision on which host flows are official release gates
- integration notes:
  - if CI cannot fully land, this card must still define a minimum local release gate and handoff checklist

## Affected Paths

- `package.json`
- `scripts/*`
- `packages/testkit/*`
- `.github/workflows/*`

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
  - targeted new smoke/e2e gate itself must pass
- generation needed:
  - none
- final verifier handoff:
  - record the final release gate command set and expected outputs

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
