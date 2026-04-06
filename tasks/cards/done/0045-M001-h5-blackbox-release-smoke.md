# M001 Card 0045 H5 Blackbox Release Smoke

## Summary

Add browser-level blackbox verification for the official H5 samples so `v1.0` is not gated only by controller-level integration scripts.

## Goal

Catch regressions that only appear in real browser rendering and event wiring for `apps/host-h5` and `apps/novel-h5` when they talk to the real API.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `h5 browser smoke`

## Scope

- In scope:
  - stand up a built or previewed H5 runtime for the official samples
  - add Playwright or equivalent browser smoke coverage for login, protected route access, and core novel continuity flows
  - wire the browser smoke into a release-facing verification command
  - document the local and CI execution path
- Out of scope:
  - full visual regression coverage
  - exhaustive route-by-route automation
  - WeChat device automation

## Ownership

- owned files:
  - `scripts/**`
  - `package.json`
  - `tests/**` or `packages/testkit/**` if needed
  - optional `.github/workflows/**`
  - relevant docs
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/contracts/**`
  - `packages/core/**`
  - `packages/features/**`

## Dependencies

- depends on:
  - `0041-api-host-integration-and-e2e-gates.md`
  - `0043-M001-cloudflare-remote-api-deploy-and-env-promotion.md`
- blocked by:
  - decision on whether CI uses local API or preview API for browser smoke
- integration notes:
  - the existing Node integration gate should remain the fast signal; this card adds a slower blackbox signal

## Affected Paths

- `package.json`
- `scripts/*`
- `tests/**`
- `.github/workflows/*`
- `README.md`

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
  - browser smoke itself must pass against the real API path
- generation needed:
  - none
- final verifier handoff:
  - record which browser flows are required for RC and which are required for final release

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
