# Card 0405 Feature Page State Merge Helper

## Summary

Centralize feature manifest page-data and initial-state merging.

## Goal

Replace repeated shallow merge blocks like default state, host page data, and `options.initialState` with one core helper so reusable feature manifests follow the same precedence and remain easier to scaffold.

## Milestone

- milestone file: none
- slice name: `feature page state merge helper`

## Priority

- priority: `P3`

## Scope

- In scope:
  - core helper for merging feature default/page/override state
  - adoption in feature manifests that already use the same shallow precedence pattern
  - unit coverage for precedence and undefined override handling
- Out of scope:
  - deep merge semantics
  - state shape changes
  - controller behavior changes

## Ownership

- owned files:
  - `packages/core/src/runtime/manifest.ts`
  - `packages/core/src/runtime/manifest.test.ts`
  - selected `packages/features/*/src/feature.manifest.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests and registries

## Dependencies

- depends on:
  - `tasks/cards/active/0401-feature-manifest-option-normalization.md`
- blocked by:
  - none
- integration notes:
  - Helper is intentionally shallow to match existing manifest behavior.

## Affected Paths

- `packages/core/src/runtime/manifest.ts`
- `packages/core/src/runtime/manifest.test.ts`
- `packages/features/*/src/feature.manifest.ts`

## Related Specs

- `packages/features/README.md`
- `docs/modules/core.md`

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
  - core manifest tests
  - selected feature manifest tests
  - `pnpm typecheck`
- generation needed:
  - none
- final verifier handoff:
  - precedence remains default state, then page data, then explicit initial state.

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
