# Card 0416 Novel H5 Reader Chip Row Adoption

## Summary

Adopt the Novel H5 chip row component in the reader page.

## Goal

Replace remaining hand-authored reader page chip markup with `renderChipRow` so reading trail, milestone, recap, and access-boundary chips share one escaping and omission path.

## Milestone

- milestone file: none
- slice name: `novel h5 reader chip row adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - reader trail chip rows
  - milestone and recap chip rows
  - access overlay and access drawer chip rows
  - Novel H5 host verification and typecheck
- Out of scope:
  - changing reader state or navigation behavior
  - changing reader copy
  - route or manifest changes

## Ownership

- owned files:
  - `apps/novel-h5/src/render/pages/reader.ts`
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
  - Preserve all existing labels and optional chip omission.

## Affected Paths

- `apps/novel-h5/src/render/pages/reader.ts`

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
  - reader chip rows render the same labels with shared escaping.

## Implementation Notes

- Adopted `renderChipRow` for reader trail, volume milestone, post-chapter recap, access overlay, and access drawer chips.
- Preserved all existing labels and optional chip visibility.
- Moved chip escaping and empty-value omission into the shared component.

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
