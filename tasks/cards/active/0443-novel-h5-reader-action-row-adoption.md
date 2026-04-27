# Card 0443 Novel H5 Reader Action Row Adoption

## Summary

Adopt Novel H5 action row primitives in the reader page.

## Goal

Reduce repeated reader action containers so sequence cards, access gates, display settings, and membership-return controls use the same reusable action rendering surface.

## Milestone

- milestone file: none
- slice name: `novel h5 reader action row adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - adopt `renderActionRow` for reader sequence and recap actions
  - adopt `renderActionRow` for access overlay and access panel actions
  - adopt `renderActionRow` for display settings panel controls
  - focused host/typecheck verification
- Out of scope:
  - reader interaction behavior changes
  - immersive toolbar redesign
  - controller, route, or state changes

## Ownership

- owned files:
  - `apps/novel-h5/src/render/pages/reader.ts`
  - `tasks/cards/active/0443-novel-h5-reader-action-row-adoption.md`
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
  - Keep reader toolbar clusters and panel shell structure local because they are immersive-reader-specific layout primitives.

## Affected Paths

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
  - Reader controller actions and panel `data-ui-*` buttons should preserve existing attributes.

## Implementation Notes

- Adopted `renderActionRow` for reader next-up, recap, chapter-complete, and membership gate actions.
- Adopted `renderActionRow` for display settings panel controls while preserving the inline value and range input.
- Kept topbar/footer toolbar clusters local because those are immersive-reader layout primitives rather than plain action rows.

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
