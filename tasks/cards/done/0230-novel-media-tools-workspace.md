# Card 0230 Novel Media Tools Workspace

## Summary

Close the remaining upload/share host gap by exposing the shared media-tools workspace on the novel hosts when justified.

## Goal

Make the novel hosts intentionally opt into or explicitly decline the shared upload/share workspace instead of leaving media-tools capability limited to the generic hosts.

## Milestone

- milestone file: none
- slice name: `novel media tools workspace`

## Priority

- priority: `P1`

## Scope

- In scope:
  - decide whether `novel-h5` and `novel-wechat` should expose the shared `mediaTools` route
  - add manifest-driven workspace routes if justified
  - preserve explicit upload/share provider posture in the rendered workspace
- Out of scope:
  - replacing the generic-host media-tools workspace

## Ownership

- owned files:
  - `packages/features/media-tools/src/**`
  - `apps/novel-h5/src/manifest/page-definitions.ts`
  - `apps/novel-wechat/src/manifest/page-definitions.ts`
  - novel host render and registration files if routes are added
  - `docs/**`
- allowed generated outputs:
  - generated manifests and WeChat shells
- forbidden files:
  - host-local upload/share state models that bypass the shared feature

## Dependencies

- depends on:
  - `tasks/cards/done/0221-upload-host-and-provider-closure.md`
  - `tasks/cards/done/0222-share-host-and-provider-closure.md`
- blocked by:
  - product decision on whether the novel sample should expose generic media workspace tooling
- integration notes:
  - keep upload/share ownership in the existing shared media-tools workspace

## Affected Paths

- `packages/features/media-tools/src/controller/index.ts`
- `packages/features/media-tools/src/model/index.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Interface Notes

- contract changes allowed:
  - no, unless route context needs explicit metadata
- store shape changes allowed:
  - yes, only for bounded novel entry context
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for workspace recovery if needed

## Verification

- slice gate:
  - novel-host stance on shared media-tools exposure is explicit and implemented or documented
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells`
- final verifier handoff:
  - include upload/share workspace host matrix across all four hosts

## Acceptance

- [x] novel-host media-tools exposure is explicitly decided
- [x] shared upload/share workspace is added where justified
- [x] upload/share provider posture remains explicit in the workspace UI
- [x] `pnpm verify` run if code changes
