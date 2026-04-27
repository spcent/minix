# Card 0431 Novel H5 Render Primitives Adoption Expansion

## Summary

Expand Novel H5 render primitive adoption across account and settings surfaces.

## Goal

Reduce remaining repeated `nh-actions` and `nh-panel` markup in common Novel H5 operational pages so future product-matrix H5 hosts can copy smaller, clearer render patterns.

## Milestone

- milestone file: none
- slice name: `novel h5 render primitives adoption expansion`

## Priority

- priority: `P3`

## Scope

- In scope:
  - adopt existing `renderActionRow` and `renderInfoPanel` helpers in account and settings pages
  - keep class names, button data attributes, and escaped text output compatible
  - focused host/typecheck verification
- Out of scope:
  - redesigning Novel H5 layout
  - moving render primitives into shared packages
  - generated registry or manifest edits

## Ownership

- owned files:
  - `apps/novel-h5/src/render/pages/account.ts`
  - `apps/novel-h5/src/render/pages/settings.ts`
  - `tasks/cards/active/0431-novel-h5-render-primitives-adoption-expansion.md`
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
  - Keep helpers host-local because feature packages remain view-agnostic.

## Affected Paths

- `apps/novel-h5/src/render/pages/account.ts`
- `apps/novel-h5/src/render/pages/settings.ts`

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
  - helper adoption must preserve escaping, button actions, and existing UI class names.

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
