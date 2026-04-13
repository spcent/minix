# Card 0108 Search Dedicated Center And Ranking Service

## Summary

Promote feed-embedded search into a dedicated cross-domain search center.

## Goal

Provide global, content, user, and domain search through a unified search feature with suggestions, hot terms, correction terms, ranking, filters, and route parameter restoration.

## Milestone

- milestone file: none
- slice name: `search dedicated center and ranking service`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add or extend a search-owned feature surface rather than relying only on feed/catalog controllers
  - implement suggestions, hot search, history, correction terms, and query route sync
  - add user search result detail links and cross-domain result grouping
  - add ranking metadata and no-result recovery states
  - add tests for all search modes and host route restoration
- Out of scope:
  - external search engine integration unless selected for this slice

## Ownership

- owned files:
  - `packages/contracts/src/api/search.ts`
  - `packages/features/feed/src/**`
  - optional search feature package under `packages/features/*`
  - `apps/api/src/app.ts`
  - `apps/api/src/store*.ts`
  - host manifest page definitions if new pages are introduced
- allowed generated outputs:
  - regenerated manifests and shells only if pages change
- forbidden files:
  - generated host files as source edits

## Dependencies

- depends on:
  - `0090-unified-search-center-and-cross-domain-results.md`
  - `0105-user-relationship-list-and-social-graph.md`
  - `0103-content-cms-authoring-and-review-console.md`
- blocked by:
  - decision whether to keep search inside feed or scaffold a dedicated feature package
- integration notes:
  - use shared contracts for search result shape across feed, user, content, and novel domains

## Affected Paths

- `packages/contracts/src/api/search.ts`
- `packages/features/feed/src/controller/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for suggestions, correction terms, ranking metadata, and result routing targets
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for search scope, filters, sorting, and keyword restoration

## Verification

- slice gate:
  - search center can query global, content, user, and domain scopes with consistent result contracts
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat pages change
- final verifier handoff:
  - verify deep-link query restoration

## Acceptance

- [x] dedicated search center or explicit search-owned surface exists
- [x] suggestions, hot terms, history, and correction terms are implemented
- [x] user/content/domain result routing is implemented
- [x] no-result and typo recovery states are implemented
- [x] filters and sort write back to route params
- [x] `pnpm verify` run
