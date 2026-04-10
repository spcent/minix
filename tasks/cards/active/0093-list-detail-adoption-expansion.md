# Card 0093 List Detail Adoption Expansion

## Summary

Expand the stronger list/detail protocol usage beyond the current feed and novel-detail proof points.

## Goal

Make the shared list/detail semantics a practical default across more business surfaces without collapsing feature boundaries.

## Milestone

- milestone file: none
- slice name: `list detail adoption expansion`

## Priority

- priority: `P2`

## Scope

- In scope:
  - adopt stronger list semantics in additional list-driven features
  - adopt stronger detail semantics in additional detail-driven features
  - align selection, pagination, load-state, contextual-entry, and detail-action behavior where duplication still exists
  - keep feature-owned domain behavior while removing repeated boilerplate state handling
- Out of scope:
  - forcing every feature through one generic controller
  - redesigning working feature boundaries solely for abstraction purity

## Ownership

- owned files:
  - `packages/contracts/src/kernel/common-page.ts`
  - `packages/core/src/page-protocols/list.ts`
  - `packages/core/src/page-protocols/detail.ts`
  - selected `packages/features/*`
  - affected tests
- allowed generated outputs:
  - generated manifests and shells if host source pages change
- forbidden files:
  - broad cross-feature rewrites with no business or duplication payoff

## Dependencies

- depends on:
  - `0079-list-and-detail-domain-hardening.md`
- blocked by:
  - none
- integration notes:
  - prioritize features where list/detail duplication is still highest

## Affected Paths

- `packages/contracts/src/kernel/common-page.ts`
- `packages/core/src/page-protocols/list.ts`
- `packages/core/src/page-protocols/detail.ts`
- selected `packages/features/*`

## Related Specs

- `docs/ARCHITECTURE.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, if broader adoption exposes missing list/detail semantics
- store shape changes allowed:
  - yes, in adopting feature state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, where contextual-entry semantics require consistency

## Verification

- slice gate:
  - at least two more feature packages adopt the stronger list/detail outputs
- generation needed:
  - run generation only if host source manifests change
- final verifier handoff:
  - record which features still intentionally keep custom list/detail state and why

## Acceptance

- [x] stronger list/detail outputs are adopted beyond current proof points
- [x] repeated pagination/selection/status/action boilerplate is reduced
- [x] feature-package boundaries remain intact
- [x] `pnpm verify` run
