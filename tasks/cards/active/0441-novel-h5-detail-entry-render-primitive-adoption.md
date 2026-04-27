# Card 0441 Novel H5 Detail Entry Render Primitive Adoption

## Summary

Adopt Novel H5 render primitives in login and novel detail pages.

## Goal

Reduce repeated action-row and simple panel markup on entry/detail surfaces so the Novel H5 storefront keeps a consistent reusable rendering vocabulary.

## Milestone

- milestone file: none
- slice name: `novel h5 detail entry render primitive adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - adopt `renderActionRow` in the login page entry actions
  - adopt `renderActionRow` in novel detail action groups
  - adopt `renderInfoPanel` for simple novel detail explanation panels
  - focused host/typecheck verification
- Out of scope:
  - visual redesign
  - controller behavior changes
  - route or store changes

## Ownership

- owned files:
  - `apps/novel-h5/src/render/pages/login.ts`
  - `apps/novel-h5/src/render/pages/novel-detail.ts`
  - `tasks/cards/active/0441-novel-h5-detail-entry-render-primitive-adoption.md`
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
  - Keep complex custom cards local when they include chips, metadata grids, or page-specific structure.

## Affected Paths

- `apps/novel-h5/src/render/pages/login.ts`
- `apps/novel-h5/src/render/pages/novel-detail.ts`

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
  - Login and detail buttons should preserve existing data attributes and route links.

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
