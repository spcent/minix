# Card 0464 H5 Render HTML Primitive Reuse

## Summary

Move duplicated H5 HTML escaping into a shared core primitive and adopt it in both official H5 hosts.

## Goal

Keep browser render helpers consistent and easier to reuse for future product hosts without each host carrying its own HTML escaping implementation.

## Milestone

- milestone file: none
- slice name: `h5 render html primitive reuse`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add a host-neutral HTML escaping helper to `packages/core`
  - replace local host and novel H5 escaping copies with the shared helper
  - add focused core coverage for escaping behavior
- Out of scope:
  - visual redesign
  - broad component extraction from `apps/host-h5/src/render/page-registry.ts`
  - platform-specific browser or WeChat behavior changes

## Ownership

- owned files:
  - `packages/core/src/runtime/html.ts`
  - `packages/core/src/runtime/html.test.ts`
  - `packages/core/src/runtime/index.ts`
  - `apps/host-h5/src/render/page-registry.ts`
  - `apps/novel-h5/src/render/utils.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests, registries, or WeChat shell outputs

## Dependencies

- depends on:
  - existing host render utilities
- blocked by:
  - none
- integration notes:
  - expose through the `@minix/core` entry point only; do not add deep imports

## Affected Paths

- `packages/core/src/runtime/*`
- `apps/host-h5/src/render/page-registry.ts`
- `apps/novel-h5/src/render/utils.ts`

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

- [x] both H5 hosts use one HTML escaping primitive
- [x] helper is exported through package entry points
- [x] helper behavior is covered by focused tests
- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added `escapeHtml` to `packages/core` and exported it through the package entry point.
- Replaced the host H5 local escape function with the shared core primitive.
- Re-exported the shared primitive from the novel H5 render utils so existing page components keep their local utility import shape.

## Verification Notes

- `pnpm verify:host host-h5`
- `pnpm verify:host novel-h5`
