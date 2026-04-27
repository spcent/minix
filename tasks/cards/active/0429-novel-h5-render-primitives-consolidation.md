# Card 0429 Novel H5 Render Primitives Consolidation

## Summary

Consolidate repeated Novel H5 action rows, info panels, and empty states into host-local render primitives.

## Goal

Reduce repeated escaped markup across Novel H5 pages while keeping UI composition host-local and reusable for future product-matrix H5 surfaces.

## Milestone

- milestone file: none
- slice name: `novel h5 render primitives consolidation`

## Priority

- priority: `P3`

## Scope

- In scope:
  - add reusable render helpers under `apps/novel-h5/src/render/components`
  - adopt them in high-repeat Novel H5 render pages
  - focused host/typecheck verification
- Out of scope:
  - visual redesign
  - shared cross-host view abstraction
  - generated registry or manifest edits

## Ownership

- owned files:
  - `apps/novel-h5/src/render/components/*`
  - selected `apps/novel-h5/src/render/pages/*`
  - `apps/novel-h5/src/render/page-registry.test.ts` if render assumptions need coverage
- allowed generated outputs:
  - none
- forbidden files:
  - generated host registries
  - generated manifests

## Dependencies

- depends on:
  - `tasks/cards/active/0403-novel-h5-stat-panel-component.md`
  - `tasks/cards/active/0407-novel-h5-chip-row-component.md`
- blocked by:
  - none
- integration notes:
  - Keep helpers in Novel H5 render components; shared feature packages must remain view-agnostic.

## Affected Paths

- `apps/novel-h5/src/render/components/*`
- `apps/novel-h5/src/render/pages/*`

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
  - helper adoption must preserve escaping, button data attributes, and existing class names.

## Implementation Notes

- Added `renderActionRow`, `renderInfoPanel`, and `renderEmptyState` as Novel H5 host-local render primitives.
- Adopted action-row and info-panel helpers in feed, feedback, messages, and media tools where repeated `nh-actions` and `nh-panel` markup was concentrated.
- Adopted the empty-state helper in catalog search results so searchable empty states share the same escaping and action filtering behavior.
- Added focused render primitive tests for action filtering and escaping.

## Verification Notes

- Ran `node --import tsx --test apps/novel-h5/src/render/components/render-primitives.test.ts apps/novel-h5/src/render/page-registry.test.ts`.
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
