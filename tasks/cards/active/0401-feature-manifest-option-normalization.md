# Card 0401 Feature Manifest Option Normalization

## Summary

Provide a shared manifest option helper for feature controller option pass-through.

## Goal

Reduce repeated optional-spread blocks in feature manifests and make future product-matrix feature packages less error-prone when passing route IDs, request paths, and redirect sources into controllers.

## Milestone

- milestone file: none
- slice name: `feature manifest option normalization`

## Priority

- priority: `P3`

## Scope

- In scope:
  - core helper that copies only defined option keys
  - targeted adoption in feature manifests with the largest optional pass-through blocks
  - unit coverage for preserving falsy-but-defined values
- Out of scope:
  - changing controller option contracts
  - moving feature defaults between packages
  - broad feature state refactors

## Ownership

- owned files:
  - `packages/core/src/runtime/manifest.ts`
  - `packages/core/src/runtime/manifest.test.ts`
  - selected `packages/features/*/src/feature.manifest.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - host generated output

## Dependencies

- depends on:
  - none
- blocked by:
  - none
- integration notes:
  - Helper belongs in core runtime manifest support because it is manifest authoring infrastructure, not a feature-specific abstraction.

## Affected Paths

- `packages/core/src/runtime/manifest.ts`
- `packages/core/src/runtime/manifest.test.ts`
- `packages/features/account/src/feature.manifest.ts`
- `packages/features/feedback/src/feature.manifest.ts`
- `packages/features/messages/src/feature.manifest.ts`

## Related Specs

- `packages/features/README.md`
- `specs/change-recipes/add-feature.md`
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
  - `pnpm typecheck`
  - core manifest tests
- generation needed:
  - none
- final verifier handoff:
  - option helper preserves explicitly defined empty strings and false values when callers use them.

## Implementation Notes

- Added `pickDefinedManifestOptions` to core manifest helpers.
- Covered the helper with a core test that preserves empty string and `false` while dropping only `undefined`.
- Adopted the helper in account, feedback, and messages feature manifests to replace repeated optional-spread pass-through blocks.

## Verification Notes

- Ran `node --import tsx --test packages/core/src/runtime/manifest.test.ts packages/features/account/src/feature.manifest.test.ts packages/features/feedback/src/feature.manifest.test.ts packages/features/messages/src/feature.manifest.test.ts`.
- Ran `pnpm typecheck`.

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
