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

## Implementation Notes

- Adopted `renderActionRow` for home hero, resume promo, milestone, membership, and lane actions.
- Adopted `renderInfoPanel` for editor desk and membership radar panels.
- Kept custom ranking and lane card layout local where the markup carries page-specific structure.

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
