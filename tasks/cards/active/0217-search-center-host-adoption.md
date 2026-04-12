# Card 0217 Search Center Host Adoption

## Summary

Promote the implemented shared search center into a deliberate official-host surface instead of an H5-only discover route.

## Goal

Expose cross-domain search on the agreed official hosts with clear route recovery, filters, and domain-scoped result behavior.

## Milestone

- milestone file: none
- slice name: `search center host adoption`

## Priority

- priority: `P1`

## Scope

- In scope:
  - decide which official hosts should expose the shared search center
  - add missing manifest-driven search routes where needed
  - verify keyword, filter, sort, correction, and route-restore behavior on those hosts
  - preserve the existing feed-owned search implementation unless a stronger boundary is required
- Out of scope:
  - introducing an external search engine or a new search package without a clear boundary reason

## Ownership

- owned files:
  - `packages/contracts/src/api/search.ts`
  - `packages/features/feed/src/**`
  - `apps/api/src/domains/content/feed.ts`
  - `apps/api/src/domains/content/search.ts`
  - `apps/*/src/manifest/page-definitions.ts`
- allowed generated outputs:
  - generated manifests and WeChat shells if host source manifests change
- forbidden files:
  - host-local search flows that bypass the shared feed/search controller

## Dependencies

- depends on:
  - `0214-messages-host-adoption-and-sync-hardening.md`
- blocked by:
  - none
- integration notes:
  - use existing feed/search contracts; do not create a second cross-domain search model

## Affected Paths

- `packages/contracts/src/api/search.ts`
- `packages/features/feed/src/controller/index.ts`
- `apps/api/src/domains/content/feed.ts`
- `apps/api/src/domains/content/search.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for search-entry metadata if needed
- store shape changes allowed:
  - yes, in feed/search state only
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for search-scope, filter, and selection recovery

## Verification

- slice gate:
  - search center is intentionally reachable on the selected official hosts and route restoration still works
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat pages change
- final verifier handoff:
  - record selected hosts and their search route ids/paths

## Acceptance

- [x] shared search center is not `host-h5`-only by accident
- [x] route recovery, filter, sort, and correction behavior remain intact on selected hosts
- [x] boundaries still match specs
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run

## Execution Notes

- 2026-04-12: added shared `feed` route wiring to `apps/host-wechat/src/manifest/page-definitions.ts` as the official WeChat search-center entry
- 2026-04-12: generated the corresponding WeChat shell and kept route ownership inside the shared feed feature
- 2026-04-12: extended the same shared `feed` route to `apps/novel-h5` and `apps/novel-wechat` so the standalone novel hosts also expose the shared discover/search center deliberately
- 2026-04-12: verified with `pnpm verify`
