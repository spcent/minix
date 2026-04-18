# Card 0261 Settings Policy And Governance Expansion

## Summary

Strengthen shared settings and policy visibility so users and operators can understand effective policy, lock posture, and environment-driven restrictions more clearly.

## Goal

Make settings a stronger policy-summary workspace without fragmenting preferences into host-local settings logic.

## Milestone

- milestone file: none
- slice name: `settings policy and governance expansion`

## Priority

- priority: `P2`

## Scope

- In scope:
  - clearer policy-source explanations for `effectivePolicy` and locked settings
  - reusable notification-policy presets across account, messages, and feedback
  - stronger debug and experiment governance for production-safe exposure
  - richer weak-network, autoplay, and device-behavior policy summaries
- Out of scope:
  - a separate policy-console host
  - host-local settings controllers with divergent policy vocabulary

## Ownership

- owned files:
  - `docs/ROADMAP.md`
  - `docs/BACKEND_CONTRACT.md`
  - `packages/contracts/src/api/settings.ts`
  - `packages/features/settings`
  - `apps/api/src/domains/settings`
- allowed generated outputs:
  - none
- forbidden files:
  - host-local settings-policy wrappers

## Dependencies

- depends on:
  - `tasks/cards/done/0249-user-and-settings-summary-alignment.md`
- blocked by:
  - final release closure for the current `P0` queue
- integration notes:
  - extend the current `preferences`, `featureToggles`, `privacyOptions`, and `effectivePolicy` posture additively

## Affected Paths

- `docs/ROADMAP.md`
- `docs/BACKEND_CONTRACT.md`
- `packages/contracts/src/api/settings.ts`
- `packages/features/settings`
- `apps/api/src/domains/settings`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`

## Interface Notes

- contract changes allowed:
  - yes, additive-only for clearer policy posture
- store shape changes allowed:
  - yes, inside the shared settings workspace
- controller action changes allowed:
  - yes
- route param changes allowed:
  - none

## Verification

- slice gate:
  - settings remains one normalized workspace while policy posture becomes clearer
- generation needed:
  - none
- final verifier handoff:
  - include policy-source, lock-state, and environment-governance posture

## Acceptance

- [x] policy-source and lock posture are clearer in the shared settings workspace
- [x] notification and experiment governance stays normalized across domains
- [x] environment-driven restrictions do not leak into host-local policy logic
- [x] settings remains a shared summary workspace
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added additive settings-envelope metadata in `packages/contracts/src/api/settings.ts` for notification presets, policy-source summaries, device-behavior summaries, and developer exposure posture.
- Extended `apps/api/src/domains/settings/state.ts` and `apps/api/src/data.ts` so the shared settings response now emits policy-source explanations, reusable notification presets, weak-network or autoplay summaries, and environment-governed developer posture.
- Updated `packages/features/settings/src/controller/index.ts` to project the new policy summaries into the existing settings workspace sections instead of introducing host-local wrappers.
- Synced `docs/BACKEND_CONTRACT.md` and `docs/ROADMAP.md` to reflect the stronger settings policy-summary baseline.

## Verification Notes

- `node --import tsx --test packages/features/settings/src/controller/index.test.ts`
- `node --import tsx --test apps/api/src/app.test.ts`
- `pnpm verify`
