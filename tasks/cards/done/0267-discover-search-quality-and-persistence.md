# Card 0267 Discover Search Quality And Persistence

## Summary

Improve discover quality, filter persistence, grouped-result clarity, and bounded search-quality behavior inside the current shared search model.

## Goal

Make discover and search more reliable across hosts without splitting discover into a separate stack.

## Milestone

- milestone file: none
- slice name: `discover search quality and persistence`

## Priority

- priority: `P2`

## Scope

- In scope:
  - clearer discover filter persistence and domain switching
  - stronger grouped-result quality signals and route-writeback posture
  - bounded typo recovery, zero-result suggestions, and recent-query reuse
- Out of scope:
  - a separate search-center runtime
  - host-specific search result models

## Ownership

- owned files:
  - `docs/ROADMAP.md`
  - `docs/BACKEND_CONTRACT.md`
  - `packages/contracts/src/api/search.ts`
  - `packages/features/feed`
  - `apps/api/src/domains/content/feed.ts`
  - `apps/api/src/domains/content/search.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - host-local discover or search result wrappers

## Dependencies

- depends on:
  - `tasks/cards/done/0250-content-search-and-discover-output-alignment.md`
  - `tasks/cards/done/0266-content-recommendation-and-moderation-governance.md`
- blocked by:
  - final release closure for the current `P0` queue
- integration notes:
  - preserve `searchQuery`, `searchFilters`, and `searchResults` as the shared discover outputs

## Affected Paths

- `docs/ROADMAP.md`
- `docs/BACKEND_CONTRACT.md`
- `packages/contracts/src/api/search.ts`
- `packages/features/feed`
- `apps/api/src/domains/content/feed.ts`
- `apps/api/src/domains/content/search.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Interface Notes

- contract changes allowed:
  - yes, additive-only inside the shared search envelope
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - limited extensions of the existing discover route family

## Verification

- slice gate:
  - discover quality improves without forking the shared search surface
- generation needed:
  - none
- final verifier handoff:
  - include grouped-result rules, filter-persistence posture, and bounded search-quality behavior

## Acceptance

- [x] discover filter persistence and grouped-result posture are clearer across hosts
- [x] typo recovery and zero-result guidance remain bounded inside the shared search model
- [x] route-writeback and reload recovery stay explicit
- [x] no separate search runtime or host-local search fork is introduced
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added additive search-envelope metadata for filter persistence, grouped-result strategy, bounded zero-result guidance, and route or storage recovery posture without creating a separate discover runtime.
- Updated `apps/api/src/domains/content/feed.ts` and `apps/api/src/domains/content/search.ts` so discover filters declare route persistence and search results expose grouped or interleaved posture plus bounded correction or empty guidance.
- Updated `packages/features/feed/src/controller/index.ts` so recent-keyword reuse, route write-back, and reload recovery are surfaced through the shared `searchResults.persistence` summary instead of host-local logic.
- Kept the existing `searchQuery`, `searchFilters`, and `searchResults` vocabulary authoritative, with only additive fields.

## Verification Notes

- `node --import tsx --test packages/features/feed/src/controller/index.test.ts`
- `node --import tsx --test apps/api/src/app.test.ts`
- `pnpm verify`
