# Card 0258 Host Capability Experience Hardening

## Summary

Define the next safe hardening path for degraded-mode UX, capability diagnostics, and host-runtime reporting across share, upload, payment, and device-dependent actions.

## Goal

Improve host capability experience while keeping capability state normalized in shared code and runtime differences isolated in platform adapters.

## Milestone

- milestone file: none
- slice name: `host capability experience hardening`

## Priority

- priority: `P2`

## Scope

- In scope:
  - tighten shared capability-state expectations for available, degraded, and unavailable flows
  - identify where host diagnostics or fallback guidance should improve for payment, share, upload, clipboard, device, and location
  - document which capability differences belong in shared state and which must stay in `packages/platform-*`
- Out of scope:
  - broad new capability families
  - hiding host runtime gaps behind host-only copy with no shared state change

## Ownership

- owned files:
  - `docs/ROADMAP.md`
  - `docs/ARCHITECTURE.md`
  - `docs/BACKEND_CONTRACT.md`
  - `packages/core`
  - `packages/platform-h5`
  - `packages/platform-wechat`
  - `packages/features/media-tools`
  - `packages/features/subscription`
- allowed generated outputs:
  - none
- forbidden files:
  - host-page-specific fallback logic that should live in shared capability state or platform adapters

## Dependencies

- depends on:
  - `tasks/cards/active/0243-payment-merchant-rollout-and-callback-ops.md`
  - `tasks/cards/active/0244-upload-provider-rollout-and-asset-host-cutover.md`
  - `tasks/cards/active/0245-share-provider-rollout-and-attribution-ops.md`
- blocked by:
  - final release closure for the current `P0` queue
- integration notes:
  - capability experience hardening should preserve the current normalized capability model rather than reintroducing host-local branching

## Affected Paths

- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/BACKEND_CONTRACT.md`
- `packages/core`
- `packages/platform-h5`
- `packages/platform-wechat`
- `packages/features/media-tools`
- `packages/features/subscription`

## Related Specs

- `docs/ARCHITECTURE.md`
- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`

## Interface Notes

- contract changes allowed:
  - limited, additive-only for clearer capability diagnostics or degraded-mode reporting
- store shape changes allowed:
  - yes, when shared capability state needs clearer normalized reporting
- controller action changes allowed:
  - yes
- route param changes allowed:
  - no

## Verification

- slice gate:
  - capability experience is clearer across hosts without pushing runtime differences back into shared business code
- generation needed:
  - none
- final verifier handoff:
  - include the normalized capability-state improvements and any preserved runtime-specific boundaries

## Acceptance

- [ ] degraded and unavailable capability posture is clearer in shared state
- [ ] payment, share, upload, and device-related diagnostics stay normalized across hosts
- [ ] runtime-specific behavior remains isolated in platform adapters
- [ ] no host-page-specific fallback layer replaces shared capability modeling
- [ ] `pnpm verify` run, or skipped with reason if this remains docs-only
