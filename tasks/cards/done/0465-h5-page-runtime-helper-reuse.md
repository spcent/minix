# Card 0465 H5 Page Runtime Helper Reuse

## Summary

Consolidate repeated H5 page route resolution, onShow activation, and store subscription helpers into core runtime utilities.

## Goal

Make future H5 product hosts reuse the same page runtime wiring primitives instead of copying route normalization and lifecycle guards into each host renderer.

## Milestone

- milestone file: none
- slice name: `h5 page runtime helper reuse`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add host-neutral helpers for route path normalization, route-map page-key resolution, optional `onShow` activation, and store-backed subscription
  - adopt the helpers in `host-h5` and `novel-h5`
  - add focused core helper coverage and preserve existing host tests
- Out of scope:
  - visual rendering changes
  - route id or manifest changes
  - generated registry or shell edits

## Ownership

- owned files:
  - `packages/core/src/runtime/page-runtime.ts`
  - `packages/core/src/runtime/page-runtime.test.ts`
  - `packages/core/src/runtime/index.ts`
  - `apps/host-h5/src/render/page-registry.ts`
  - `apps/novel-h5/src/render/page-registry.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests, registries, or WeChat shell outputs

## Dependencies

- depends on:
  - existing H5 page registry contracts
- blocked by:
  - none
- integration notes:
  - expose helpers through `@minix/core`; hosts must not deep import core internals

## Affected Paths

- `packages/core/src/runtime/*`
- `apps/host-h5/src/render/page-registry.ts`
- `apps/novel-h5/src/render/page-registry.ts`

## Related Specs

- `specs/dependency-rules.yaml`
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
  - `pnpm verify:host host-h5`
  - `pnpm verify:host novel-h5`
- generation needed:
  - none
- final verifier handoff:
  - run `pnpm verify` after all cards in this batch

## Acceptance

- [x] H5 page key resolution uses the shared route-map helper
- [x] H5 page activation uses the shared optional `onShow` helper
- [x] H5 page subscriptions use the shared store-backed helper
- [x] trailing slashes resolve consistently for both H5 hosts
- [x] helper behavior is covered by focused tests
- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added core runtime helpers for route path normalization, route-map page-key lookup, optional page activation, and store-backed subscriptions.
- Adopted the helpers in both H5 host render registries through the `@minix/core` entry point.
- Added trailing-slash route assertions for both H5 hosts.

## Verification Notes

- `pnpm verify:host host-h5`
- `pnpm verify:host novel-h5`
