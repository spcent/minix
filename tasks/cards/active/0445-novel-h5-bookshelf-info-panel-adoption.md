# Card 0445 Novel H5 Bookshelf Info Panel Adoption

## Summary

Adopt Novel H5 info panel primitives in the bookshelf page.

## Goal

Reduce repeated bookshelf explanation-panel markup so shelf curation, active-lane, and archive surfaces share the same reusable panel helper.

## Milestone

- milestone file: none
- slice name: `novel h5 bookshelf info panel adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - adopt `renderInfoPanel` for simple bookshelf panels with label/copy/title/actions
  - keep panels local when they require multiple paragraphs or custom collection structure
  - focused host/typecheck verification
- Out of scope:
  - shelf behavior changes
  - visual redesign
  - controller, route, or state changes

## Ownership

- owned files:
  - `apps/novel-h5/src/render/pages/bookshelf.ts`
  - `tasks/cards/active/0445-novel-h5-bookshelf-info-panel-adoption.md`
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
  - Keep multi-paragraph shelf lane cards local until `renderInfoPanel` supports richer structured bodies.

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
  - Bookshelf panel copy and actions should preserve escaping and controller data attributes.

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
