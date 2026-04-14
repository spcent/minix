# Card 0236 Upload Storage And Review Provider Cutover

## Summary

Replace sample-backed upload storage and review posture with a production-ready provider integration plan.

## Goal

Make upload execution, asset retention, and content review production-capable across H5 and WeChat hosts.

## Milestone

- milestone file: none
- slice name: `upload storage and review provider cutover`

## Priority

- priority: `P0`

## Scope

- In scope:
  - integrate a real object storage target and asset URL strategy
  - integrate or document the selected content-review provider path
  - validate upload governance, retry, cancellation, and attachment lifecycles against production posture
  - update host copy so media-tools and attachment flows no longer imply sample-only review/storage in production mode
- Out of scope:
  - introducing a new standalone upload workspace outside existing media-tools and attachment flows

## Ownership

- owned files:
  - `packages/contracts/src/api/upload.ts`
  - `packages/features/media-tools/src/**`
  - `apps/api/src/domains/uploads/**`
  - `docs/**`
- allowed generated outputs:
  - generated manifests and shells only if host media-tools copy changes
- forbidden files:
  - committed storage credentials or provider secrets

## Dependencies

- depends on:
  - `tasks/cards/done/0221-upload-host-and-provider-closure.md`
  - `tasks/cards/done/0101-upload-object-storage-and-review-completion.md`
- blocked by:
  - selected object storage and content review providers
- integration notes:
  - keep attachment flows in feedback and discover aligned with the same shared upload contract

## Affected Paths

- `packages/contracts/src/api/upload.ts`
- `packages/features/media-tools/src/controller/index.ts`
- `apps/api/src/domains/uploads/routes.ts`
- `apps/api/src/domains/uploads/pipeline.ts`
- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`

## Interface Notes

- contract changes allowed:
  - yes, for provider references, review results, and asset URL posture
- store shape changes allowed:
  - yes, in upload task and asset metadata
- controller action changes allowed:
  - yes
- route param changes allowed:
  - no new route is expected

## Verification

- slice gate:
  - upload storage and review no longer depend on sample-only posture in the production path
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if media-tools copy changes on WeChat
- final verifier handoff:
  - include storage provider, review provider, and asset URL posture

## Acceptance

- [x] real storage provider path replaces sample-only production posture
- [x] content review path is wired or explicitly documented for production
- [x] attachment and media-tools surfaces reflect production-safe storage/review state
- [x] docs distinguish repo-owned upload flow from operator-owned provider setup
- [x] `pnpm verify` run if code changes
