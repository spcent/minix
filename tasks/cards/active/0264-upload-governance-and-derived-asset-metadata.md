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

- [ ] derived-asset metadata remains additive to the shared upload envelope
- [ ] governance, retention, and ownership posture is clearer in shared state
- [ ] upload stays one normalized pipeline across hosts
- [ ] no host-specific upload fork is introduced
- [ ] `pnpm verify` run, or skipped with reason if docs-only
