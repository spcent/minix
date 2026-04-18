# Card 0270 Adapter Observability And Environment Drift Audit

## Summary

Improve adapter observability, remote evidence packaging, and environment-drift comparison across local, preview, and production rollout posture.

## Goal

Make host-runtime differences and deployment drift easier to inspect without weakening the shared boundary or release gates.

## Milestone

- milestone file: none
- slice name: `adapter observability and environment drift audit`

## Priority

- priority: `P2`

## Scope

- In scope:
  - stronger adapter observability and normalized degraded-mode summaries
  - repeatable remote evidence packs for preview and production verification
  - environment-drift comparison between local, preview, and production rollout posture
- Out of scope:
  - committed production secrets
  - a separate observability platform inside tracked source

## Ownership

- owned files:
  - `docs/ROADMAP.md`
  - `docs/PRODUCTION_READINESS.md`
  - `docs/PRODUCTION_REGRESSION_MATRIX.md`
  - `docs/VERIFICATION_LOG.md`
  - `scripts`
  - `apps/api/src/domains/ops`
  - `packages/platform-h5`
  - `packages/platform-wechat`
- allowed generated outputs:
  - none
- forbidden files:
  - sample-only shortcuts that weaken release evidence

## Dependencies

- depends on:
  - `tasks/cards/done/0253-provider-adapters-and-ops-hardening.md`
  - `tasks/cards/done/0254-verification-and-evidence-automation-hardening.md`
  - `tasks/cards/active/0268-capability-health-and-host-readiness-snapshots.md`
- blocked by:
  - final release closure for the current `P0` queue
- integration notes:
  - extend the current ops and verification posture instead of creating a second diagnostic channel

## Affected Paths

- `docs/ROADMAP.md`
- `docs/PRODUCTION_READINESS.md`
- `docs/PRODUCTION_REGRESSION_MATRIX.md`
- `docs/VERIFICATION_LOG.md`
- `scripts`
- `apps/api/src/domains/ops`
- `packages/platform-h5`
- `packages/platform-wechat`

## Related Specs

- `docs/PRODUCTION_READINESS.md`
- `docs/RELEASE_RUNBOOK.md`
- `docs/PRODUCTION_REGRESSION_MATRIX.md`

## Interface Notes

- contract changes allowed:
  - limited additive-only for clearer diagnostics
- store shape changes allowed:
  - yes, when shared diagnostics need clearer normalized posture
- controller action changes allowed:
  - limited to observability and degraded-mode reporting
- route param changes allowed:
  - none

## Verification

- slice gate:
  - environment drift and adapter posture are easier to compare without weakening the current release boundary
- generation needed:
  - none
- final verifier handoff:
  - include evidence-pack structure, drift-report rules, and adapter-observability posture

## Acceptance

- [ ] degraded-mode and adapter observability are clearer without leaking host APIs into shared business code
- [ ] remote evidence packs are repeatable across preview and production
- [ ] local, preview, and production rollout posture can be compared more directly
- [ ] no release gate is weakened to compensate for missing observability
- [ ] `pnpm verify` run, or skipped with reason if docs-only
