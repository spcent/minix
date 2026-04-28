# Card 0468 H5 Display Format Helper Hardening

## Summary

Move common H5 date and compact-number formatting into core display helpers with invalid-value fallbacks.

## Goal

Make future H5 product hosts reuse resilient display formatting primitives instead of carrying local formatter implementations that differ on empty or invalid values.

## Milestone

- milestone file: none
- slice name: `h5 display format helper hardening`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add core display helpers for short date and compact number formatting
  - preserve novel H5 utility exports while delegating to the shared helpers
  - add focused tests for missing, invalid, and normal values
- Out of scope:
  - visual redesign
  - localization policy changes
  - API date contract changes

## Ownership

- owned files:
  - `packages/core/src/runtime/display-format.ts`
  - `packages/core/src/runtime/display-format.test.ts`
  - `packages/core/src/runtime/index.ts`
  - `apps/novel-h5/src/render/utils.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests, registries, or WeChat shell outputs

## Dependencies

- depends on:
  - existing novel H5 render utilities
- blocked by:
  - none
- integration notes:
  - expose through `@minix/core`; keep existing novel H5 utility import shape stable

## Affected Paths

- `packages/core/src/runtime/*`
- `apps/novel-h5/src/render/utils.ts`

## Related Specs

- `docs/modules/core.md`
- `docs/modules/hosts.md`

## Interface Notes

- contract changes allowed:
  - no
- store shape changes allowed:
  - no
- controller action changes allowed:
  - no
- route param changes allowed:
  - no

## Verification

- slice gate:
  - `pnpm verify:host novel-h5`
- generation needed:
  - none
- final verifier handoff:
  - run `pnpm verify` after all cards in this batch

## Acceptance

- [x] novel H5 date and compact number utilities delegate to shared core helpers
- [x] invalid date inputs fall back to stable copy instead of throwing
- [x] invalid number inputs fall back to stable copy
- [x] helper behavior is covered by focused tests
- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added core display helpers for short date and compact number formatting.
- Kept existing novel H5 utility exports stable while delegating to the shared helpers.
- Added invalid date and invalid number fallbacks so display formatting cannot throw on malformed values.

## Verification Notes

- `node --import tsx --test packages/core/src/runtime/display-format.test.ts`
- `pnpm verify:host novel-h5`
