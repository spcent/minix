# Card 0407 Novel H5 Chip Row Component

## Summary

Extract reusable Novel H5 chip and chip-row rendering helpers.

## Goal

Reduce repeated `<span class="nh-chip">` rendering and make host-local Novel H5 pages/components reuse one escaped chip renderer for badges, milestones, access labels, and status rows.

## Milestone

- milestone file: none
- slice name: `novel h5 chip row component`

## Priority

- priority: `P3`

## Scope

- In scope:
  - reusable chip and chip-row component helpers under Novel H5 render components
  - adoption in high-repeat Novel H5 components/pages
  - host verification and typecheck
- Out of scope:
  - CSS redesign
  - moving view helpers into shared feature packages
  - generated host output edits

## Ownership

- owned files:
  - `apps/novel-h5/src/render/components/*`
  - selected `apps/novel-h5/src/render/pages/*`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host registries

## Dependencies

- depends on:
  - `tasks/cards/active/0403-novel-h5-stat-panel-component.md`
- blocked by:
  - none
- integration notes:
  - Keep renderer helpers host-local because shared features remain view-agnostic.

## Affected Paths

- `apps/novel-h5/src/render/components/*`
- `apps/novel-h5/src/render/pages/home.ts`
- `apps/novel-h5/src/render/pages/catalog.ts`
- `apps/novel-h5/src/render/pages/novel-detail.ts`

## Related Specs

- `docs/ARCHITECTURE.md`
- `docs/modules/hosts.md`

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
  - all chip labels remain escaped and existing `nh-chip-row`/`nh-chip` classes stay intact.

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
