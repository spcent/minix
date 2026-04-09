# Card 0085 Upload Media Pipeline Productionization

## Summary

Move upload from capability reservation and contract demo into a fuller media pipeline with backend-facing upload results, governance, and lifecycle handling.

## Goal

Turn upload into a reusable business capability that can support feedback, avatars, attachments, and later content publishing flows.

## Milestone

- milestone file: none
- slice name: `upload media pipeline productionization`

## Priority

- priority: `P0`

## Scope

- In scope:
  - introduce sample backend upload endpoints or upload-session abstractions behind the shared upload contract
  - implement end-to-end choose -> validate -> return asset -> governance/result handling flows
  - expand retry/cancel/progress semantics beyond local reservation-only state
  - connect feedback and later account/content flows to real upload results instead of sample assets only
  - model moderation/review and expiry cleanup states more concretely
  - preserve platform-specific file/media selection behind adapters
- Out of scope:
  - production object storage, CDN signing, or real chunked upload infrastructure
  - media transcoding pipelines

## Ownership

- owned files:
  - `packages/contracts/src/api/upload.ts`
  - `packages/platform-h5/src/adapters/capability.adapter.ts`
  - `packages/platform-wechat/src/adapters/capability.adapter.ts`
  - `packages/features/media-tools/src/**`
  - `packages/features/feedback/src/**`
  - optional account/content feature files as needed
  - `apps/api/src/app.ts`
  - affected tests
- allowed generated outputs:
  - generated manifests and shells if host-visible upload pages change
- forbidden files:
  - shared-code calls to browser file inputs or `wx.chooseMedia`

## Dependencies

- depends on:
  - `0076-upload-share-foundation.md`
  - `0077-feedback-ticket-foundation.md`
- blocked by:
  - none
- integration notes:
  - do not fork a second upload model inside feedback or account features; reuse the shared upload contract

## Affected Paths

- `packages/contracts/src/api/upload.ts`
- `packages/platform-h5/src/adapters/capability.adapter.ts`
- `packages/platform-wechat/src/adapters/capability.adapter.ts`
- `packages/features/media-tools/src/controller/index.ts`
- `packages/features/feedback/src/controller/index.ts`
- optional `packages/features/account/src/**`
- `apps/api/src/app.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, refine upload-session, progress, governance, and result fields
- store shape changes allowed:
  - yes, in upload-consuming feature state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, only when upload flows require explicit return targets

## Verification

- slice gate:
  - at least one business feature uploads through the shared pipeline and receives a real shared `uploadAsset` result
- generation needed:
  - run generation only if host source manifests change
- final verifier handoff:
  - record which upload stages are adapter-only versus backend-backed

## Acceptance

- [x] upload has a real shared end-to-end pipeline instead of only reservation state
- [x] feedback or another business feature consumes real upload results
- [x] governance and lifecycle states are explicit in sample behavior, not only in contract shape
- [x] platform-specific file/media selection stays inside adapter layers
- [x] `pnpm verify` run
