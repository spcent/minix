# Card 0412 Novel H5 Reader Toc Chip Row Adoption

## Summary

Adopt the Novel H5 chip row component in reader and TOC surfaces.

## Goal

Replace repeated hand-authored reader and directory chip markup with the shared Novel H5 chip row renderer so reading-position indicators are easier to reuse and less error-prone.

## Milestone

- milestone file: none
- slice name: `novel h5 reader toc chip row adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - reader panel chip rows
  - TOC milestone and chapter chip rows
  - Novel H5 host verification and typecheck
- Out of scope:
  - changing reader state projections
  - changing copy or chapter flow semantics
  - route or manifest changes

## Ownership

- owned files:
  - `apps/novel-h5/src/render/components/reader-panels.ts`
  - `apps/novel-h5/src/render/pages/toc.ts`
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
  - Preserve empty optional chip omission and existing chapter descriptor labels.

## Affected Paths

- `apps/novel-h5/src/render/components/reader-panels.ts`
- `apps/novel-h5/src/render/pages/toc.ts`

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
  - reader and TOC chip rows render the same labels with shared escaping.

## Implementation Notes

- Adopted `renderChipRow` in reader panel summary and chapter rows.
- Adopted `renderChipRow` in TOC milestone and chapter rows.
- Preserved chapter descriptor labels and optional pinned-highlight behavior while moving escaping into the shared component.

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
