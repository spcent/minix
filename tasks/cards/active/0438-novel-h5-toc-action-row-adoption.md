# Card 0438 Novel H5 TOC Action Row Adoption

## Summary

Adopt Novel H5 action row primitives in the table-of-contents page.

## Goal

Reduce repeated TOC action markup so chapter and volume controls use the same reusable rendering surface as other Novel H5 pages.

## Milestone

- milestone file: none
- slice name: `novel h5 toc action row adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - adopt `renderActionRow` for top-level TOC actions
  - adopt `renderActionRow` for volume and chapter actions where markup is a plain action container
  - focused host/typecheck verification
- Out of scope:
  - TOC layout redesign
  - controller behavior changes
  - chapter flow descriptor changes

## Ownership

- owned files:
  - `apps/novel-h5/src/render/pages/toc.ts`
  - `tasks/cards/active/0438-novel-h5-toc-action-row-adoption.md`
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
  - Keep TOC state and chapter descriptors feature-owned; this card only changes host-local rendering composition.

## Affected Paths

- `apps/novel-h5/src/render/pages/toc.ts`

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
  - TOC chapter selection and reader navigation buttons should keep their existing data attributes.

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
