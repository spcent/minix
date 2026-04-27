# Card 0444 Novel H5 Membership Render Primitive Adoption

## Summary

Adopt Novel H5 render primitives in the membership page.

## Goal

Reduce repeated membership page action rows and simple explanation panels so premium unlock flows share reusable Novel H5 rendering helpers.

## Milestone

- milestone file: none
- slice name: `novel h5 membership render primitive adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - adopt `renderActionRow` for membership hero, plan, milestone, and history actions
  - adopt `renderInfoPanel` for simple trust, after-purchase, and status panels
  - focused host/typecheck verification
- Out of scope:
  - membership behavior changes
  - plan copy or pricing changes
  - controller, route, or state changes

## Ownership

- owned files:
  - `apps/novel-h5/src/render/pages/membership.ts`
  - `tasks/cards/active/0444-novel-h5-membership-render-primitive-adoption.md`
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
  - Keep plan cards and comparison rows page-local because those layouts are membership-specific.

## Affected Paths

- `apps/novel-h5/src/render/pages/membership.ts`

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
  - Membership purchase, continue, catalog, and milestone buttons should preserve data attributes.

## Implementation Notes

- Adopted `renderActionRow` for membership hero, plan cards, milestone, and milestone history actions.
- Adopted `renderInfoPanel` for simple trust and after-purchase explanation panels.
- Kept plan cards, comparison rows, and issue-style promise panels local because those blocks carry membership-specific structure.

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
