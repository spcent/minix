# Core State Snapshot Helpers

Status: done

## Summary

Add small core snapshot helpers for deep-cloning state values, optional values, and arrays, then adopt them in shared page protocols.

## Goal

Future product-matrix controllers should have a standard state snapshot vocabulary instead of scattering raw `structuredClone` calls across shared protocol factories.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: core state snapshot reuse

## Scope

- In scope:
  - add reusable snapshot helpers under `packages/core/src/store`
  - use them in list, detail, and form page protocol factories
  - add focused helper tests
  - update the product-matrix reuse playbook with the state snapshot recommendation
- Out of scope:
  - broad controller rewrites across every feature package
  - changing store mutation semantics
  - changing public page protocol field names

## Ownership

- owned files:
  - `packages/core/src/store/snapshot.ts`
  - `packages/core/src/store/snapshot.test.ts`
  - `packages/core/src/store/index.ts`
  - `packages/core/src/page-protocols/list.ts`
  - `packages/core/src/page-protocols/detail.ts`
  - `packages/core/src/page-protocols/form.ts`
  - `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host files

## Dependencies

- depends on: `0286-api-provider-posture-runtime-helpers`
- blocked by: none
- integration notes: keep helpers generic and data-only; do not introduce a new state management abstraction.

## Affected Paths

- `packages/core/...`
- `docs/...`
- `tasks/cards/...`

## Related Specs

- `docs/ARCHITECTURE.md`
- `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed: none
- store shape changes allowed: none
- controller action changes allowed: none
- route param changes allowed: none

## Verification

- slice gate: `pnpm typecheck` and `pnpm test`
- generation needed: no
- final verifier handoff: `pnpm verify`

## Acceptance

- [x] snapshot helper covers value, optional value, and array cloning
- [x] page protocols use the helper for clone-heavy state fields
- [x] helper tests prove clone isolation
- [x] public page protocol field names and defaults remain unchanged
- [x] playbook records the helper as the core-side state snapshot reuse point
- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added `cloneStateSnapshot`, `cloneOptionalStateSnapshot`, and `cloneStateSnapshotArray` under `packages/core/src/store/snapshot.ts`.
- Adopted the helpers in shared list, detail, and form page protocol factories.
- Added focused tests proving value, optional, and array snapshot behavior.
