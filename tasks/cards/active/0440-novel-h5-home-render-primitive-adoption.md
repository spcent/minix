# Card 0440 Novel H5 Home Render Primitive Adoption

## Summary

Adopt Novel H5 render primitives in the home page.

## Goal

Reduce repeated home page action row and simple info panel markup so the storefront page stays aligned with reusable Novel H5 render primitives.

## Milestone

- milestone file: none
- slice name: `novel h5 home render primitive adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - adopt `renderActionRow` for plain home page action containers
  - adopt `renderInfoPanel` for simple editor desk panels
  - focused host/typecheck verification
- Out of scope:
  - visual redesign
  - storefront content changes
  - controller or route behavior changes

## Ownership

- owned files:
  - `apps/novel-h5/src/render/pages/home.ts`
  - `tasks/cards/active/0440-novel-h5-home-render-primitive-adoption.md`
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
  - Keep page-specific merchandising layout local when markup contains non-action content or custom card structure.

## Affected Paths

- `apps/novel-h5/src/render/pages/home.ts`

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
  - Home page action buttons should preserve existing data attributes and route links.

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
