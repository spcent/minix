# Card 0277 Search Discover Expansion

## Summary

Expand search ranking, synonym, correction, recent-search, and route writeback behavior through the discover/feed surface.

## Goal

Improve global, content, user, and domain search while preserving canonical `searchQuery`, `searchFilters`, and `searchResults` outputs.

## Milestone

- milestone file: none
- slice name: `search discover expansion`

## Priority

- priority: `P2`

## Scope

- In scope:
  - domain-specific ranking strategies
  - synonym and correction dictionaries
  - persisted recent-search pruning
  - route writeback and restore-sensitive filter state
- Out of scope:
  - caller-local search result wrappers
  - a separate search route map
  - deep imports from content/search internals

## Ownership

- owned files:
  - `packages/contracts/src/api/search.ts`
  - `packages/features/feed`
  - `apps/api/src/domains/content/search.ts`
  - `apps/api/src/domains/content/feed.ts`
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- allowed generated outputs:
  - regenerated manifests or shells only if source manifests change
- forbidden files:
  - handwritten generated outputs

## Dependencies

- depends on:
  - `tasks/cards/done/0267-discover-search-quality-and-persistence.md`
  - `tasks/cards/done/0240-search-ranking-and-result-quality-tuning.md`
- blocked by:
  - ranking and persistence product policy decisions
- integration notes:
  - search remains discover/feed-centered for official hosts

## Affected Paths

- `packages/contracts/src/api/search.ts`
- `packages/features/feed`
- `apps/api/src/domains/content/search.ts`
- `apps/api/src/domains/content/feed.ts`
- `apps/*/src/manifest/page-definitions.ts`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - additive-only
- store shape changes allowed:
  - additive-only in feed search state
- controller action changes allowed:
  - yes, within feed controller search actions
- route param changes allowed:
  - additive-only for route writeback

## Verification

- slice gate:
  - `pnpm verify:feature feed`
- generation needed:
  - none unless route params require manifest source changes
- final verifier handoff:
  - include hot, recent, correction, zero-result, filtered, sorted, and route-restored search examples

## Acceptance

- [x] search expansion keeps `searchQuery`, `searchFilters`, and `searchResults` canonical
- [x] recent-search persistence remains bounded and recoverable
- [x] route writeback is explicit and testable
- [x] ranking behavior is documented when user-visible
- [x] docs updated for search workflow changes
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added additive `SearchQualitySummary` under `searchResults` for ranking, synonym, correction, recent-search, route writeback, and zero-result summaries.
- Populated quality summaries from the shared content search builder without changing canonical `searchQuery`, `searchFilters`, or `searchResults`.
- Stored search quality summary in feed state after initial load, search submit, refresh, and pagination.
- Covered recent-search pruning/writeback and correction recovery in feed controller tests.

## Verification Notes

- Ran `pnpm verify:feature feed`.
