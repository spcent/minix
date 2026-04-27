# Card 0418 Novel H5 Reading Stat Panel Adoption

## Summary

Adopt shared stat panels on Novel H5 reading pages.

## Goal

Replace repeated reading-surface stat panel markup with `renderStatPanels` so TOC, membership, and bookshelf hero metrics share one renderer and stay reusable.

## Milestone

- milestone file: none
- slice name: `novel h5 reading stat panel adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - TOC page hero stats
  - membership page hero stats
  - bookshelf page hero stats
  - secondary bookshelf programming stat strip if it matches the shared component
  - Novel H5 host verification and typecheck
- Out of scope:
  - changing metrics or copy
  - changing membership or bookshelf behavior
  - route or manifest changes

## Ownership

- owned files:
  - `apps/novel-h5/src/render/pages/toc.ts`
  - `apps/novel-h5/src/render/pages/membership.ts`
  - `apps/novel-h5/src/render/pages/bookshelf.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated manifests and registries

## Dependencies

- depends on:
  - `0403-novel-h5-stat-panel-component`
- blocked by:
  - none
- integration notes:
  - Preserve existing labels, values, and notes.

## Affected Paths

- `apps/novel-h5/src/render/pages/toc.ts`
- `apps/novel-h5/src/render/pages/membership.ts`
- `apps/novel-h5/src/render/pages/bookshelf.ts`

## Related Specs

- `docs/modules/novel-h5.md`

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
  - reading page stat strips render the same content through the shared component.

## Implementation Notes

- Pending.

## Verification Notes

- Pending.

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
