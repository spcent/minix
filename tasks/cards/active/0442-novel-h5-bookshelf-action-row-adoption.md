# Card 0442 Novel H5 Bookshelf Action Row Adoption

## Summary

Adopt Novel H5 action row primitives in the bookshelf page.

## Goal

Reduce repeated bookshelf action containers so shelf filters, title actions, milestones, and archive controls share the same action rendering surface.

## Milestone

- milestone file: none
- slice name: `novel h5 bookshelf action row adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - adopt `renderActionRow` for bookshelf hero, filters, pinned/selected title, milestone, inventory, active stack, and archive actions
  - keep custom shelf panels and lane cards local
  - focused host/typecheck verification
- Out of scope:
  - visual redesign
  - filter/sort behavior changes
  - controller or route changes

## Ownership

- owned files:
  - `apps/novel-h5/src/render/pages/bookshelf.ts`
  - `tasks/cards/active/0442-novel-h5-bookshelf-action-row-adoption.md`
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
  - Keep shelf state and selection rules feature-owned; this card only changes host-local rendering composition.

## Affected Paths

- `apps/novel-h5/src/render/pages/bookshelf.ts`

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
  - Bookshelf filter, sort, selection, pin, continue, detail, and remove buttons should preserve data attributes.

## Implementation Notes

- Adopted `renderActionRow` for hero, filter, and sort actions.
- Adopted `renderActionRow` for pinned and selected shelf title controls.
- Adopted `renderActionRow` for milestone, inventory, active stack, and completed archive actions.
- Kept shelf-specific panels and lane cards local because those blocks carry custom collection structure.

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
