# Card 0264 Upload Governance And Derived Asset Metadata

## Summary

Extend the shared upload model with richer governance and derived-asset visibility while keeping upload one normalized pipeline.

## Goal

Make upload assets, retention, ownership, and review posture more informative without creating a second media pipeline.

## Milestone

- milestone file: none
- slice name: `upload governance and derived asset metadata`

## Priority

- priority: `P2`

## Scope

- In scope:
  - richer derived-asset metadata such as variants, covers, duration, and review annotations
  - stronger governance summaries for retention, reference ownership, and cleanup state
  - clearer reference and asset-lifecycle visibility in shared upload outputs
- Out of scope:
  - a host-specific media pipeline
  - a separate asset-management console

## Ownership

- owned files:
  - `docs/ROADMAP.md`
  - `docs/BACKEND_CONTRACT.md`
  - `packages/contracts/src/api/upload.ts`
  - `packages/features/media-tools`
  - `apps/api/src/domains/uploads`
- allowed generated outputs:
  - none
- forbidden files:
  - host-local upload-asset wrappers

## Dependencies

- depends on:
  - `tasks/cards/active/0244-upload-provider-rollout-and-asset-host-cutover.md`
  - `tasks/cards/done/0252-cross-domain-context-envelope-audit.md`
- blocked by:
  - final release closure for the current `P0` queue
- integration notes:
  - preserve `uploadTask`, `uploadAsset`, and `uploadError` as the shared upload outputs

## Affected Paths

- `docs/ROADMAP.md`
- `docs/BACKEND_CONTRACT.md`
- `packages/contracts/src/api/upload.ts`
- `packages/features/media-tools`
- `apps/api/src/domains/uploads`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`

## Interface Notes

- contract changes allowed:
  - yes, additive-only on the shared upload envelope
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - none

## Verification

- slice gate:
  - upload governance and asset detail improve without splitting the pipeline model
- generation needed:
  - none
- final verifier handoff:
  - include asset-metadata additions, governance posture, and retention rules

## Acceptance

- [x] derived-asset metadata remains additive to the shared upload envelope
- [x] governance, retention, and ownership posture is clearer in shared state
- [x] upload stays one normalized pipeline across hosts
- [x] no host-specific upload fork is introduced
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added additive upload-envelope fields for governance summaries, retention summaries, ownership summaries, review annotations, and derived variants in `packages/contracts/src/api/upload.ts`.
- Updated `apps/api/src/domains/uploads/pipeline.ts` to keep one normalized upload pipeline while projecting governance, derived-asset, retention, cleanup, and reference-owner posture through `uploadTask`, `uploadAsset`, `reviewRecord`, `cleanupRecord`, and `references`.
- Updated `packages/features/media-tools` to retain upload review, cleanup, and reference state together with host-visible governance, ownership, retention, and derived-asset summaries.
- Synced `docs/BACKEND_CONTRACT.md` and `docs/ROADMAP.md` to the current upload-governance posture.

## Verification Notes

- `node --import tsx --test packages/features/media-tools/src/controller/index.test.ts`
- `node --import tsx --test apps/api/src/app.test.ts`
- `pnpm verify`
