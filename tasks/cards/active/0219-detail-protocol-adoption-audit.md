# Card 0219 Detail Protocol Adoption Audit

## Summary

Audit detail-surface adoption so the shared detail protocol remains the canonical model for business detail states.

## Goal

Confirm that official detail surfaces consistently express availability, deletion, invalidation, permission, and deep-link recovery through the shared detail protocol.

## Milestone

- milestone file: none
- slice name: `detail protocol adoption audit`

## Priority

- priority: `P2`

## Scope

- In scope:
  - inventory dedicated and embedded detail surfaces by host
  - verify detail status usage for ready, stale, unavailable, forbidden, deleted, and recovered-from-link semantics
  - identify where inline host detail experiences should become explicit routeable entries
- Out of scope:
  - introducing a universal detail page abstraction

## Ownership

- owned files:
  - `packages/core/src/page-protocols/detail.ts`
  - adopting feature packages under `packages/features/*`
  - `apps/*/src/manifest/page-definitions.ts`
- allowed generated outputs:
  - generated manifests and WeChat shells if host source manifests change
- forbidden files:
  - host-local detail models that duplicate the shared protocol

## Dependencies

- depends on:
  - `0218-list-protocol-adoption-audit.md`
- blocked by:
  - none
- integration notes:
  - keep routeable detail entry decisions explicit instead of relying on ad hoc inline expansion

## Affected Paths

- `packages/core/src/page-protocols/detail.ts`
- `packages/features/messages/src/**`
- `packages/features/subscription/src/**`
- `packages/features/novel-detail/src/**`
- `packages/features/reader/src/**`
- `apps/*/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `specs/repo.yaml`

## Interface Notes

- contract changes allowed:
  - none unless a concrete shared-detail gap is found
- store shape changes allowed:
  - yes, only where an adopting feature misses shared detail semantics
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, only for deep-link recovery alignment

## Verification

- slice gate:
  - official detail surfaces either use the shared protocol or have an explicit documented reason not to
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if host pages change
- final verifier handoff:
  - include host-by-host detail adoption matrix

## Acceptance

- [ ] detail adoption is audited across official hosts
- [ ] deep-link and unavailable-state handling stays explicit in shared code
- [ ] host wiring remains manifest- and registry-driven
- [ ] boundaries still match specs
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run
