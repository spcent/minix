# Card 0404 Feature Manifest Option Helper Expansion

## Summary

Expand `pickDefinedManifestOptions` adoption across remaining feature manifests.

## Goal

Remove repeated optional-spread pass-through blocks from feature manifests so route IDs, request paths, boolean options, and callbacks are passed consistently when future product-matrix features copy these patterns.

## Milestone

- milestone file: none
- slice name: `feature manifest option helper expansion`

## Priority

- priority: `P3`

## Scope

- In scope:
  - adopt `pickDefinedManifestOptions` in remaining high-repeat `packages/features/*/src/feature.manifest.ts`
  - preserve required option fields and callback wrapping behavior
  - targeted feature manifest tests and typecheck
- Out of scope:
  - changing controller option contracts
  - changing page data defaults or host entry actions
  - generated host output edits

## Ownership

- owned files:
  - `packages/features/*/src/feature.manifest.ts`
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
  - Keep callback adaptation local where the controller needs a different callback signature.

## Affected Paths

- `packages/features/auth/src/feature.manifest.ts`
- `packages/features/settings/src/feature.manifest.ts`
- `packages/features/feed/src/feature.manifest.ts`
- `packages/features/catalog/src/feature.manifest.ts`
- other selected feature manifests with optional pass-through repetition

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
  - feature manifest tests
  - `pnpm typecheck`
- generation needed:
  - none
- final verifier handoff:
  - required controller options remain explicit and optional values are copied only when defined.

## Implementation Notes

- Adopted `pickDefinedManifestOptions` in auth, settings, feed, catalog, items, novel-detail, subscription, media-tools, toc, bookshelf, and reader feature manifests.
- Kept required controller options explicit and left auth `reportError` callback wrapping local because the controller expects a single-message callback.
- Confirmed no old optional-spread pass-through patterns remain in feature manifests.

## Verification Notes

- Ran `node --import tsx --test packages/features/*/src/feature.manifest.test.ts packages/core/src/runtime/manifest.test.ts`.
- Ran `pnpm typecheck`.

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
