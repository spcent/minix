# Card 0413 Novel H5 Membership Bookshelf Chip Row Adoption

## Summary

Adopt the Novel H5 chip row component in membership and bookshelf surfaces.

## Goal

Replace repeated membership and bookshelf milestone/status chip markup with the shared Novel H5 chip row renderer so product-facing reading programs keep a consistent reusable component surface.

## Milestone

- milestone file: none
- slice name: `novel h5 membership bookshelf chip row adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - membership hero, plan, and milestone chip rows
  - bookshelf spotlight, milestone, and inventory chip rows
  - Novel H5 host verification and typecheck
- Out of scope:
  - changing membership recommendation logic
  - changing bookshelf filtering or sorting
  - route or manifest changes

## Ownership

- owned files:
  - `apps/novel-h5/src/render/pages/membership.ts`
  - `apps/novel-h5/src/render/pages/bookshelf.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated manifests and registries

## Dependencies

- depends on:
  - `0407-novel-h5-chip-row-component`
- blocked by:
  - none
- integration notes:
  - Preserve optional chip omission and existing visible text.

## Affected Paths

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
  - membership and bookshelf chip rows render the same labels with shared escaping.

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
