# Card 0090 Unified Search Center And Cross-Domain Results

## Summary

Upgrade search from feed/catalog implementations into a shared multi-domain search center with clearer route semantics and result composition.

## Goal

Make `global / content / user / domain` search modes behave like real shared product surfaces instead of contract-level possibilities backed mainly by catalog and feed.

## Milestone

- milestone file: none
- slice name: `unified search center`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add a shared search-center flow that can compose cross-domain results
  - support user-search and broader content-search behavior on top of existing feed/catalog search primitives
  - keep recent searches, hot searches, suggestion terms, filters, and sort options coherent across domains
  - normalize route semantics for search entry, search replay, and query persistence
  - avoid duplicating search-state orchestration inside each feature package
- Out of scope:
  - production search infrastructure or ranking services
  - semantic/vector search

## Ownership

- owned files:
  - `packages/contracts/src/api/search.ts`
  - `packages/features/feed/src/**`
  - `packages/features/catalog/src/**`
  - optional new search-center feature package under `packages/features/*`
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - selected host source manifests
  - affected tests
- allowed generated outputs:
  - generated manifests and shells if host source pages change
- forbidden files:
  - isolated host-only search stores that bypass the shared search contract

## Dependencies

- depends on:
  - `0073-search-and-feed-surface-foundation.md`
  - `0071-user-account-domain-foundation.md`
- blocked by:
  - none
- integration notes:
  - unify search orchestration where it reduces duplication, but do not force feed and catalog into one controller if domain differences stay material

## Affected Paths

- `packages/contracts/src/api/search.ts`
- `packages/features/feed/src/controller/index.ts`
- `packages/features/catalog/src/controller/index.ts`
- optional new search-center feature package
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- optional `apps/*/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for cross-domain result grouping and query semantics
- store shape changes allowed:
  - yes, in search-consuming feature state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for search-center query persistence and result tabs

## Verification

- slice gate:
  - one shared search center or equivalent shared orchestration can exercise more than one search domain
- generation needed:
  - run generation only if host source manifests change
- final verifier handoff:
  - record which search domains are fully backed versus still narrowed to sample data

## Acceptance

- [ ] global search is more than a feed-only wrapper
- [ ] user-search and broader content-search are representable through real shared flows
- [ ] search route/query persistence stays normalized across hosts
- [ ] feed/catalog search reuse shared primitives instead of diverging further
- [ ] `pnpm verify` run
