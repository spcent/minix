# Card 0403 Novel H5 Stat Panel Component

## Summary

Extract reusable Novel H5 stat panel rendering.

## Goal

Reduce repeated `<article class="nh-stat-panel">` markup across Novel H5 pages and make future product-matrix H5 surfaces reuse a single escaped stat-panel component.

## Milestone

- milestone file: none
- slice name: `novel h5 stat panel component`

## Priority

- priority: `P3`

## Scope

- In scope:
  - reusable stat panel renderer under `apps/novel-h5/src/render/components`
  - adoption in high-repeat Novel H5 pages
  - focused render tests/typecheck
- Out of scope:
  - CSS redesign
  - shared cross-host view abstraction
  - generated registry or manifest edits

## Ownership

- owned files:
  - `apps/novel-h5/src/render/components/*`
  - selected `apps/novel-h5/src/render/pages/*`
  - `apps/novel-h5/src/render/page-registry.test.ts` if snapshots/assertions need updates
- allowed generated outputs:
  - none
- forbidden files:
  - generated host registries

## Dependencies

- depends on:
  - none
- blocked by:
  - none
- integration notes:
  - Keep this as a host render component; do not move view markup into shared feature packages.

## Affected Paths

- `apps/novel-h5/src/render/components/*`
- `apps/novel-h5/src/render/pages/home.ts`
- `apps/novel-h5/src/render/pages/catalog.ts`
- `apps/novel-h5/src/render/pages/messages.ts`

## Related Specs

- `docs/ARCHITECTURE.md`
- `docs/modules/hosts.md`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - none
- controller action changes allowed:
  - none
- route param changes allowed:
  - none

## Verification

- slice gate:
  - `pnpm verify:host novel-h5`
  - `pnpm typecheck`
- generation needed:
  - none
- final verifier handoff:
  - stat labels, values, and notes remain escaped and visually class-compatible.

## Implementation Notes

- Added `renderStatPanel` and `renderStatPanels` under Novel H5 render components.
- Adopted the component in home, catalog, and messages where repeated `nh-stat-panel` markup was concentrated.
- Kept the helper host-local so shared feature packages remain view-agnostic.

## Verification Notes

- Ran `pnpm verify:host novel-h5`.
- Ran `pnpm typecheck`.

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
