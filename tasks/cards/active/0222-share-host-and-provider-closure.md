# Card 0222 Share Host And Provider Closure

## Summary

Close the gap between the implemented share/attribution flow and the official host entry surfaces plus channel/provider posture.

## Goal

Expose shared share-preparation and attribution behavior intentionally on the selected official hosts and make poster/short-link/sample channel behavior explicit.

## Milestone

- milestone file: none
- slice name: `share host and provider closure`

## Priority

- priority: `P1`

## Scope

- In scope:
  - define which official hosts should expose the share workspace directly
  - add missing manifest-driven share routes where justified
  - verify return recognition, attribution reporting, and route restoration through those hosts
  - document channel degradation and sample-provider behavior clearly
- Out of scope:
  - introducing host-local share payload assembly outside the shared feature

## Ownership

- owned files:
  - `packages/contracts/src/api/share.ts`
  - `packages/features/media-tools/src/**`
  - `apps/api/src/domains/share/**`
  - `apps/*/src/manifest/page-definitions.ts`
- allowed generated outputs:
  - generated manifests and WeChat shells if host source manifests change
- forbidden files:
  - direct host-local share attribution models that bypass the shared contracts

## Dependencies

- depends on:
  - `0221-upload-host-and-provider-closure.md`
- blocked by:
  - provider/domain decision for durable short links and poster generation
- integration notes:
  - keep channel-specific execution inside platform adapters and shared capability ports

## Affected Paths

- `packages/contracts/src/api/share.ts`
- `packages/features/media-tools/src/controller/index.ts`
- `apps/api/src/domains/share/routes.ts`
- `apps/api/src/domains/share/attribution.ts`
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
  - yes, in share/media-tools state only
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for return recognition and attribution params

## Verification

- slice gate:
  - selected official hosts expose the shared share flow and attribution survives return recognition
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat pages change
- final verifier handoff:
  - record host entry matrix and channel/provider degradation matrix

## Acceptance

- [x] shared share flow is intentionally reachable on selected official hosts
- [x] return recognition and attribution reporting remain intact
- [x] sample-backed poster/short-link/channel behavior is labeled clearly where it remains
- [x] boundaries still match specs
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run

## Execution Notes

- 2026-04-12: reused the shared `mediaTools` workspace as the official WeChat host entry for share preparation and attribution reporting
- 2026-04-12: exposed share/report actions through the shared media-tools feature manifest instead of host-local handlers
- 2026-04-12: media-tools state and host rendering now expose share provider/channel posture explicitly, including sample-backed poster generation and host-native dispatch fallback wording
