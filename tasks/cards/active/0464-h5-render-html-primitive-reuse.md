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

- [ ] both H5 hosts use one HTML escaping primitive
- [ ] helper is exported through package entry points
- [ ] helper behavior is covered by focused tests
- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
