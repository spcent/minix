# Card 0221 Upload Host And Provider Closure

## Summary

Close the gap between the implemented upload pipeline and the official host entry surfaces plus provider/storage posture.

## Goal

Expose the shared upload workflow intentionally on the remaining official hosts and make review/storage provider behavior explicit instead of sample-only by implication.

## Milestone

- milestone file: none
- slice name: `upload host and provider closure`

## Priority

- priority: `P1`

## Scope

- In scope:
  - define which official hosts should expose the upload workspace directly
  - add missing manifest-driven routes for upload where justified
  - verify attachment-oriented flows that already depend on upload, such as feedback and managed content
  - document review/storage provider posture where sample behavior still remains
- Out of scope:
  - introducing platform calls into shared feature code

## Ownership

- owned files:
  - `packages/contracts/src/api/upload.ts`
  - `packages/features/media-tools/src/**`
  - `packages/features/feedback/src/**`
  - `apps/api/src/domains/uploads/**`
  - `apps/*/src/manifest/page-definitions.ts`
- allowed generated outputs:
  - generated manifests and WeChat shells if host source manifests change
- forbidden files:
  - direct shared-code access to `wx` or browser file APIs

## Dependencies

- depends on:
  - `0214-messages-host-adoption-and-sync-hardening.md`
- blocked by:
  - provider decision for non-sample storage and review backends
- integration notes:
  - keep upload as a shared workspace/capability flow, not a host-only utility page

## Affected Paths

- `packages/contracts/src/api/upload.ts`
- `packages/features/media-tools/src/controller/index.ts`
- `packages/features/feedback/src/controller/index.ts`
- `apps/api/src/domains/uploads/routes.ts`
- `apps/api/src/domains/uploads/pipeline.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `AGENTS.md`

## Interface Notes

- contract changes allowed:
  - yes, for provider-state wording or host-entry metadata
- store shape changes allowed:
  - yes, in upload/media-tools state only
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, if upload recovery or detail entry needs them

## Verification

- slice gate:
  - selected official hosts expose shared upload intentionally and provider posture is explicit
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat pages change
- final verifier handoff:
  - record host entry matrix and storage/review provider posture

## Acceptance

- [x] upload is not effectively `host-h5`-only by accident
- [x] upload-dependent flows continue to use shared pipeline outputs
- [x] sample-backed provider behavior is labeled clearly where it remains
- [x] boundaries still match specs
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run

## Execution Notes

- 2026-04-12: added shared `mediaTools` route wiring to `apps/host-wechat/src/manifest/page-definitions.ts` so upload/share workspace is reachable on the official WeChat host
- 2026-04-12: exposed upload/share/report/clear actions through the shared media-tools feature manifest for both hosts
- 2026-04-12: media-tools state and host rendering now expose upload review/storage posture explicitly, including `sample-upload-policy` when the sample backend remains active
