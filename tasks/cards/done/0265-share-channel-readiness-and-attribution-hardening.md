# Card 0265 Share Channel Readiness And Attribution Hardening

## Summary

Strengthen shared share-channel readiness, fallback visibility, and attribution diagnostics without widening the current share model.

## Goal

Make share behavior easier to reason about across native share, clipboard fallback, short-link, and poster flows.

## Milestone

- milestone file: none
- slice name: `share channel readiness and attribution hardening`

## Priority

- priority: `P2`

## Scope

- In scope:
  - clearer share-channel readiness summaries for native share, clipboard fallback, short-link, and poster paths
  - stronger attribution replay, return-recognition, and invite-binding diagnostics
  - clearer provider readiness and fallback posture inside shared share state
- Out of scope:
  - a separate growth or campaign console
  - host-specific share flows that bypass the shared share envelope

## Ownership

- owned files:
  - `docs/ROADMAP.md`
  - `docs/BACKEND_CONTRACT.md`
  - `packages/contracts/src/api/share.ts`
  - `packages/features/media-tools`
  - `apps/api/src/domains/share`
- allowed generated outputs:
  - none
- forbidden files:
  - host-local share-channel wrappers

## Dependencies

- depends on:
  - `tasks/cards/active/0245-share-provider-rollout-and-attribution-ops.md`
  - `tasks/cards/done/0258-host-capability-experience-hardening.md`
- blocked by:
  - final release closure for the current `P0` queue
- integration notes:
  - preserve `sharePayload`, `shareChannel`, and `shareAttribution` as the canonical share outputs

## Affected Paths

- `docs/ROADMAP.md`
- `docs/BACKEND_CONTRACT.md`
- `packages/contracts/src/api/share.ts`
- `packages/features/media-tools`
- `apps/api/src/domains/share`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`

## Interface Notes

- contract changes allowed:
  - yes, additive-only inside the normalized share envelope
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - none

## Verification

- slice gate:
  - share-channel readiness and attribution diagnostics improve without widening the share model
- generation needed:
  - none
- final verifier handoff:
  - include channel-readiness rules, fallback posture, and attribution-diagnostic additions

## Acceptance

- [x] share-channel readiness is clearer across native, clipboard, short-link, and poster flows
- [x] attribution replay and invite-binding diagnostics stay additive to the shared share model
- [x] fallback posture remains normalized across hosts
- [x] no host-local share fork is introduced
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added additive share-envelope fields for payload readiness, channel readiness, fallback posture, replay diagnostics, recognition summaries, and invite-binding summaries in `packages/contracts/src/api/share.ts`.
- Updated `apps/api/src/domains/share/attribution.ts` so prepare, resolve, return-recognition, and attribution-report responses all project normalized readiness and diagnostics metadata without creating host-local share wrappers.
- Updated `packages/features/media-tools` to preserve short-link and poster metadata together with host-visible readiness, fallback, and attribution-diagnostic summaries in shared state.
- Synced `docs/BACKEND_CONTRACT.md` and `docs/ROADMAP.md` to the current share hardening posture.

## Verification Notes

- `node --import tsx --test packages/features/media-tools/src/controller/index.test.ts`
- `node --import tsx --test apps/api/src/app.test.ts`
- `pnpm verify`
