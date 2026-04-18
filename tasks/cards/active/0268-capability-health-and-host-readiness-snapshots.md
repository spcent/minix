# Card 0268 Capability Health And Host Readiness Snapshots

## Summary

Add clearer host-readiness snapshots for payment, share, upload, clipboard, and location without leaking host APIs into shared business code.

## Goal

Make capability health easier to inspect in shared state and host-visible diagnostics while preserving adapter boundaries.

## Milestone

- milestone file: none
- slice name: `capability health and host readiness snapshots`

## Priority

- priority: `P2`

## Scope

- In scope:
  - capability-health snapshots that summarize host readiness for payment, share, upload, clipboard, and location
  - shared summary posture for degraded, unavailable, and native capability states
  - bounded diagnostics that can be reused by host surfaces without adding host-local fallback systems
- Out of scope:
  - direct host API calls in shared code
  - a dedicated platform diagnostic console

## Ownership

- owned files:
  - `docs/ROADMAP.md`
  - `docs/ARCHITECTURE.md`
  - `packages/core`
  - `packages/features/media-tools`
  - `packages/features/subscription`
  - `packages/platform-h5`
  - `packages/platform-wechat`
- allowed generated outputs:
  - none
- forbidden files:
  - host-page-specific fallback layers that bypass shared capability state

## Dependencies

- depends on:
  - `tasks/cards/done/0258-host-capability-experience-hardening.md`
- blocked by:
  - final release closure for the current `P0` queue
- integration notes:
  - normalize capability health in shared code first; keep runtime implementation details in `packages/platform-*`

## Affected Paths

- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `packages/core`
- `packages/features/media-tools`
- `packages/features/subscription`
- `packages/platform-h5`
- `packages/platform-wechat`

## Related Specs

- `docs/ARCHITECTURE.md`
- `docs/BACKEND_CONTRACT.md`

## Interface Notes

- contract changes allowed:
  - limited additive-only for clearer capability snapshots
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - none

## Verification

- slice gate:
  - capability health is clearer across hosts without moving runtime differences back into shared business code
- generation needed:
  - none
- final verifier handoff:
  - include normalized capability snapshot shape and preserved platform boundaries

## Acceptance

- [ ] capability-health snapshots stay normalized in shared state
- [ ] host readiness is clearer for payment, share, upload, clipboard, and location
- [ ] adapter-specific behavior remains isolated in platform packages
- [ ] no host-local fallback system replaces shared capability modeling
- [ ] `pnpm verify` run, or skipped with reason if docs-only
