# Card 0436 Novel H5 Catalog Render Primitive Adoption

## Summary

Adopt Novel H5 render primitives in the catalog page.

## Goal

Reduce repeated catalog page panel and action-row markup so the catalog remains a reusable product-matrix storefront surface instead of a one-off page template.

## Milestone

- milestone file: none
- slice name: `novel h5 catalog render primitive adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - adopt `renderActionRow` for catalog spotlight actions
  - adopt `renderInfoPanel` for repeated catalog panels and recommendation lanes
  - focused host/typecheck verification
- Out of scope:
  - visual redesign
  - filter behavior changes
  - generated registry or manifest edits

## Ownership

- owned files:
  - `apps/novel-h5/src/render/pages/catalog.ts`
  - `tasks/cards/active/0436-novel-h5-catalog-render-primitive-adoption.md`
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
  - Keep rendering helpers host-local; shared catalog feature state remains view-agnostic.

## Affected Paths

- `apps/novel-h5/src/render/pages/catalog.ts`

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
  - catalog actions, labels, and copy should preserve existing escaping and data attributes.

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
