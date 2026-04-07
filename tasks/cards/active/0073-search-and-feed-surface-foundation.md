# Card 0073 Search And Feed Surface Foundation

## Summary

Promote the current catalog search and scaffold feed work into a shared search/discovery surface that can support global search, domain search, and reusable feed/list behaviors.

## Goal

Turn partial novel-only discovery behavior into explicit contracts and feature packages for `searchQuery`, `searchFilters`, `searchResults`, and reusable discovery feeds.

## Milestone

- milestone file: none
- slice name: `search and discovery`

## Scope

- In scope:
  - add shared search contracts for `searchQuery`, `searchFilters`, and `searchResults`
  - cover keyword entry, suggestion terms, recent searches, hot searches, filters, sort, empty state, and route write-back semantics
  - define whether `feed` stays a generic feature package or becomes a specific search/discovery shell used by multiple business domains
  - widen API sample support for search/filter/sort inputs and outputs beyond the current catalog-only ad hoc shape
  - model global search, domain search, user search, and content search as explicit contract modes, even if only some are sample-backed
  - adopt the finalized search/feed surface in at least one official host manifest
- Out of scope:
  - external search engine integration
  - typo correction or recommendation ranking systems beyond sample behavior
  - full user search and geo search implementation

## Ownership

- owned files:
  - `packages/contracts/src/api/**`
  - `packages/core/src/page-protocols/list.ts`
  - `packages/features/feed/src/**`
  - `packages/features/catalog/src/**`
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - selected `apps/*/src/manifest/page-definitions.ts`
  - affected tests
- allowed generated outputs:
  - generated manifests and shells if a host page is added or rewired
- forbidden files:
  - unrelated auth or payment domain files

## Dependencies

- depends on:
  - `0071-user-account-domain-foundation.md`
- blocked by:
  - none
- integration notes:
  - avoid baking novel-specific semantics into the generic feed contract

## Affected Paths

- `packages/core/src/page-protocols/list.ts`
- `packages/features/feed/src/model/index.ts`
- `packages/features/feed/src/controller/index.ts`
- `packages/features/feed/src/feature.manifest.ts`
- `packages/features/catalog/src/model/index.ts`
- `packages/features/catalog/src/controller/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- selected host `page-definitions.ts`

## Related Specs

- `README.md`
- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for search and feed result types
- store shape changes allowed:
  - yes, for feed/catalog state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for normalized search state write-back

## Verification

- slice gate:
  - at least one official host uses the normalized search/feed contract for keyword, filter, sort, and recent-search persistence
- generation needed:
  - run generation only if host manifest sources change
- final verifier handoff:
  - record the generic feed surface versus domain-specific catalog extensions
  - record which search modes are fully sample-backed versus contract-only

## Acceptance

- [ ] search contracts are no longer embedded only in catalog controller internals
- [ ] feed/search route param handling is normalized and reusable
- [ ] `@minix/feature-feed` is either adopted by a host or explicitly re-scoped with a documented reason
- [ ] at least one host manifest adopts the resulting shared surface
- [ ] `pnpm verify` run
