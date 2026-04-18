# Card 0254 Verification And Evidence Automation Hardening

## Summary

Improve verification coverage and evidence capture around the current official sample surface so release confidence depends less on ad hoc manual tracking.

## Goal

Reduce release drift by making preview, production, and cross-host evidence more explicit and more repeatable.

## Milestone

- milestone file: none
- slice name: `verification and evidence automation hardening`

## Priority

- priority: `P1`

## Scope

- In scope:
  - strengthen automated checks for preview or production parity and provider-fallback posture
  - tighten evidence expectations for operator-owned rollout decisions
  - improve regression guards for cross-host route restore and identity-transition behavior
  - align release-facing documentation with the real verification steps
- Out of scope:
  - inventing a fully automated Mini Program production runner
  - widening the official sample surface

## Ownership

- owned files:
  - `docs/ROADMAP.md`
  - `docs/PRODUCTION_READINESS.md`
  - `docs/RELEASE_RUNBOOK.md`
  - `docs/VERIFICATION_LOG.md`
  - `docs/PRODUCTION_REGRESSION_MATRIX.md`
  - `scripts`
  - `tests/e2e`
- allowed generated outputs:
  - none
- forbidden files:
  - sample-only shortcuts that weaken existing release gates

## Dependencies

- depends on:
  - `tasks/cards/active/0246-release-execution-and-signoff.md`
  - `tasks/cards/done/0247-release-follow-up-queue-coordination.md`
- blocked by:
  - none
- integration notes:
  - post-release hardening should improve evidence discipline without changing the release boundary itself

## Affected Paths

- `docs/ROADMAP.md`
- `docs/PRODUCTION_READINESS.md`
- `docs/RELEASE_RUNBOOK.md`
- `docs/VERIFICATION_LOG.md`
- `docs/PRODUCTION_REGRESSION_MATRIX.md`
- `scripts`
- `tests/e2e`

## Related Specs

- `docs/PRODUCTION_READINESS.md`
- `docs/RELEASE_RUNBOOK.md`
- `docs/VERIFICATION_LOG.md`

## Interface Notes

- contract changes allowed:
  - no, unless a verification gap proves a missing observable field
- store shape changes allowed:
  - no, unless a release-critical verification surface needs explicit state
- controller action changes allowed:
  - limited to better observability for already-supported flows
- route param changes allowed:
  - no

## Verification

- slice gate:
  - release evidence and regression coverage are clearer and more repeatable for the current official sample surface
- generation needed:
  - none
- final verifier handoff:
  - include the strengthened verification matrix and any updated evidence template

## Acceptance

- [x] release-facing automation better reflects the current official sample surface
- [x] operator-owned rollout evidence is easier to capture and compare across environments
- [x] cross-host route restore and identity-transition coverage is tighter where currently under-specified
- [x] no release gate is weakened to compensate for missing evidence
- [x] `pnpm verify` run, or skipped with reason if this remains docs-only

## Implementation Notes

- `verify:api:remote` now checks the authenticated `/ops/diagnostics` response and requires the shared `providerReadiness` summary to be present
- release-facing docs now treat provider-readiness diagnostics as part of the remote verification posture instead of an undocumented manual step

## Verification Notes

- verified through `node --import tsx --test apps/api/src/app.test.ts`
- verified through `pnpm verify:api`
