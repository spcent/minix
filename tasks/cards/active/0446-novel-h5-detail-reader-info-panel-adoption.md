# Card 0446 Novel H5 Detail Reader Info Panel Adoption

## Summary

Adopt Novel H5 info panel primitives for residual simple detail and reader panels.

## Goal

Reduce remaining simple panel markup in detail and reader surfaces while leaving custom chips, toolbar, and range-control structures local.

## Milestone

- milestone file: none
- slice name: `novel h5 detail reader info panel adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - adopt `renderInfoPanel` for novel detail release rail panels
  - adopt `renderInfoPanel` for simple reader access-panel outcome copy/actions
  - focused host/typecheck verification
- Out of scope:
  - reader toolbar redesign
  - detail layout redesign
  - controller, route, or state changes

## Ownership

- owned files:
  - `apps/novel-h5/src/render/pages/novel-detail.ts`
  - `apps/novel-h5/src/render/pages/reader.ts`
  - `tasks/cards/active/0446-novel-h5-detail-reader-info-panel-adoption.md`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host registries
  - generated manifests

## Dependencies

- depends on:
  - `tasks/cards/active/0429-novel-h5-render-primitives-consolidation.md`
- blocked by:
  - none
- integration notes:
  - Do not change reader access chips or display range controls in this slice.

## Affected Paths

- `apps/novel-h5/src/render/pages/novel-detail.ts`
- `apps/novel-h5/src/render/pages/reader.ts`

## Related Specs

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
  - Detail release rail and reader access actions should preserve text escaping and data attributes.

## Implementation Notes

- Adopted `renderInfoPanel` for detail release profile status and current route panels.
- Adopted `renderInfoPanel` for the reader access unlock outcome panel.
- Kept reader access state and display setting panels local because they include chips, range inputs, or inline setting values.

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
