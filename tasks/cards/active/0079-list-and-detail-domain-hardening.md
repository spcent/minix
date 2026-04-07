# Card 0079 List And Detail Domain Hardening

## Summary

Upgrade the current protocol-level list/detail scaffolds into explicit reusable business surfaces for loading, pagination, state handling, contextual entry, and detail actions.

## Goal

Make list/detail protocols strong enough to back real business features consistently instead of remaining thin scaffolding with uneven feature-specific behavior.

## Milestone

- milestone file: none
- slice name: `list and detail domain hardening`

## Scope

- In scope:
  - normalize shared list outputs for `items`, `pagination`, `filters`, and `selectedItemId`
  - cover list behaviors such as first load, pull-to-refresh, load more, incremental append, retry, loading/empty/error/partial/skeleton states, selection, batch selection, sort, filter, and sticky headers
  - normalize shared detail outputs for `detailData`, `detailStatus`, and `detailActions`
  - cover detail behaviors such as loading, refresh, invalidation, deleted, permission denied, offline/unpublished, favorite, like, share, purchase, consult, edit, delete, and contextual entry from list/share/deep-link flows
  - align feature-specific list/detail implementations with the normalized protocol layer where it reduces duplication
- Out of scope:
  - introducing a universal rendering framework
  - rewriting every existing feature to one generic controller if the abstractions do not hold

## Ownership

- owned files:
  - `packages/contracts/src/kernel/common-page.ts`
  - `packages/core/src/page-protocols/list.ts`
  - `packages/core/src/page-protocols/detail.ts`
  - selected feature packages under `packages/features/*`
  - selected host source manifests if route params or actions change
  - affected tests
- allowed generated outputs:
  - generated manifests and shells when host source manifests change
- forbidden files:
  - unrelated auth/user/payment domain files unless required for integration

## Dependencies

- depends on:
  - `0073-search-and-feed-surface-foundation.md`
  - `0078-content-domain-foundation.md`
- blocked by:
  - none
- integration notes:
  - preserve local feature ownership; use stronger shared protocols to reduce duplication, not to collapse feature boundaries

## Affected Paths

- `packages/contracts/src/kernel/common-page.ts`
- `packages/core/src/page-protocols/list.ts`
- `packages/core/src/page-protocols/detail.ts`
- selected `packages/features/*/src/model/index.ts`
- selected `packages/features/*/src/controller/index.ts`
- selected host `page-definitions.ts`

## Related Specs

- `README.md`
- `docs/ARCHITECTURE.md`
- `packages/features/README.md`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - yes, refine common list/detail contracts
- store shape changes allowed:
  - yes, where features adopt the stronger protocol outputs
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, when contextual entry and return-path semantics need normalization

## Verification

- slice gate:
  - at least two existing feature packages reuse the stronger list/detail protocol outputs without behavioral regression
- generation needed:
  - run generation only if host manifest sources change
- final verifier handoff:
  - record which list/detail behaviors are now protocol-backed versus still feature-specific

## Acceptance

- [ ] list outputs explicitly cover pagination, filters, selection, and state semantics
- [ ] detail outputs explicitly cover status, actions, and entry-context semantics
- [ ] stronger protocols reduce duplication without breaking feature-package boundaries
- [ ] `pnpm verify` run

