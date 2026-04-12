# Card 0218 List Protocol Adoption Audit

## Summary

Audit list-surface adoption so the shared list protocol remains the actual state model across business domains.

## Goal

Confirm that official host list surfaces consistently use the shared list protocol semantics for loading, pagination, selection, filters, and route recovery.

## Milestone

- milestone file: none
- slice name: `list protocol adoption audit`

## Priority

- priority: `P2`

## Scope

- In scope:
  - inventory official list surfaces by host and feature
  - verify list status coverage for loading, empty, error, append, refresh, and restored-from-route states
  - identify any host-visible list surfaces that still bypass shared list semantics
- Out of scope:
  - redesigning the list protocol itself unless a concrete gap is found

## Ownership

- owned files:
  - `packages/core/src/page-protocols/list.ts`
  - adopting feature packages under `packages/features/*`
  - `apps/*/src/manifest/page-definitions.ts`
- allowed generated outputs:
  - generated manifests and WeChat shells if host source manifests change
- forbidden files:
  - host-local list abstractions that parallel the shared protocol

## Dependencies

- depends on:
  - `0217-search-center-host-adoption.md`
- blocked by:
  - none
- integration notes:
  - keep this slice audit-first and local; only make code changes where adoption gaps are concrete

## Affected Paths

- `packages/core/src/page-protocols/list.ts`
- `packages/features/items/src/**`
- `packages/features/messages/src/**`
- `packages/features/feed/src/**`
- `packages/features/subscription/src/**`
- `packages/features/account/src/**`
- `apps/*/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `specs/repo.yaml`

## Interface Notes

- contract changes allowed:
  - none unless a concrete protocol gap is found
- store shape changes allowed:
  - yes, only where an adopting feature currently misses shared list semantics
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, only for list-state recovery alignment

## Verification

- slice gate:
  - every official host list surface maps to the shared protocol or has an explicit documented exception
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if host pages change
- final verifier handoff:
  - include host-by-host list adoption matrix

## Acceptance

- [ ] list adoption is audited across official hosts
- [ ] protocol gaps are concrete and local, not hypothetical
- [ ] host wiring remains manifest- and registry-driven
- [ ] boundaries still match specs
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run
