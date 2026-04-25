# Form Workspace Controller Snapshot Adoption

Status: done

## Summary

Adopt core state snapshot helpers in account, feed, and feedback controller clone-state paths, which are the primary reusable form/workspace patterns for future product matrices.

## Goal

Complex form and workspace controllers should use the same snapshot helper vocabulary as page protocols, media-tools, and messages, reducing clone-style drift across reusable feature packages.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: form workspace snapshot adoption

## Scope

- In scope:
  - migrate account controller `cloneState` to snapshot helpers
  - migrate feed controller `cloneState` to snapshot helpers
  - migrate feedback controller `cloneState` to snapshot helpers
  - update reuse playbook guidance
- Out of scope:
  - changing controller actions
  - broad rewrites of every inline `structuredClone` outside clone-state paths
  - changing public state field names or store semantics

## Ownership

- owned files:
  - `packages/features/account/src/controller/index.ts`
  - `packages/features/feed/src/controller/index.ts`
  - `packages/features/feedback/src/controller/index.ts`
  - `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host files

## Dependencies

- depends on: `0289-feature-controller-snapshot-adoption`
- blocked by: none
- integration notes: behavior-preserving helper adoption only; no new controller abstraction.

## Affected Paths

- `packages/features/...`
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

- slice gate: `pnpm verify:feature account`, `pnpm verify:feature feed`, `pnpm verify:feature feedback`
- generation needed: no
- final verifier handoff: `pnpm verify`

## Acceptance

- [x] account controller clone-state path uses core snapshot helpers
- [x] feed controller clone-state path uses core snapshot helpers
- [x] feedback controller clone-state path uses core snapshot helpers
- [x] public controller APIs and state fields remain unchanged
- [x] playbook records form/workspace controller snapshot guidance
- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Migrated account controller `cloneState` to `cloneStateSnapshot` and `cloneStateSnapshotArray`.
- Migrated feed controller `cloneState` to the same snapshot helpers.
- Migrated feedback controller `cloneState` to the same snapshot helpers.
- Kept controller APIs and state field names unchanged.
