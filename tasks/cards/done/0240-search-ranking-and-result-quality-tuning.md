# Card 0240 Search Ranking And Result Quality Tuning

## Summary

Track the remaining search-domain gap after host adoption closure: product-quality tuning for ranking, recall, suggestion quality, and correction behavior.

## Goal

Improve search-result quality without reopening the already-closed host-surface and shared-contract work.

## Milestone

- milestone file: none
- slice name: `search ranking and result quality tuning`

## Priority

- priority: `P2`

## Scope

- In scope:
  - tune ranking, correction terms, hot keywords, and recent-search reuse
  - refine domain-specific result blending across feed, content, user, and novel search scopes
  - identify missing quality signals and metrics for search-result usefulness
- Out of scope:
  - redoing the search center route structure already implemented

## Ownership

- owned files:
  - `packages/features/feed/src/**`
  - `apps/api/src/domains/content/feed.ts`
  - `apps/api/src/domains/content/search.ts`
  - `docs/**`
- allowed generated outputs:
  - generated manifests and shells only if host search copy changes
- forbidden files:
  - host-local search stores that fork shared feed/search state

## Dependencies

- depends on:
  - `tasks/cards/done/0217-search-center-host-adoption.md`
- blocked by:
  - product ranking goals and search-quality measurement criteria
- integration notes:
  - preserve the shared discover/feed route as the canonical search entry while improving result quality

## Affected Paths

- `packages/features/feed/src/controller/index.ts`
- `packages/features/feed/src/model/index.ts`
- `apps/api/src/domains/content/feed.ts`
- `apps/api/src/domains/content/search.ts`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Interface Notes

- contract changes allowed:
  - yes, if ranking or correction metadata must become explicit
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - no new route is expected

## Verification

- slice gate:
  - search-result quality is measurably improved without reopening host-surface gaps
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` only if WeChat search copy changes
- final verifier handoff:
  - include ranking assumptions, correction behavior, and result-quality notes

## Acceptance

- [x] ranking and correction behavior are intentionally tuned
- [x] cross-domain result blending is improved or explicitly documented
- [x] host discover/search surfaces keep using the shared feed/search source of truth
- [x] `pnpm verify` run if code changes
