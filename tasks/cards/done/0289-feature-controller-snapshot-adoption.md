# Feature Controller Snapshot Adoption

Status: done

## Summary

Adopt the core state snapshot helpers in the media-tools and messages controllers, which are common templates for future workspace and inbox-style product surfaces.

## Goal

Reusable feature controllers should use the same snapshot helper vocabulary as core page protocols when cloning state for stores and initial-state merges.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: feature controller snapshot adoption

## Scope

- In scope:
  - migrate `packages/features/media-tools` controller clone state to snapshot helpers
  - migrate `packages/features/messages` controller clone state to snapshot helpers
  - update the reuse playbook with controller-level snapshot guidance
- Out of scope:
  - broad rewrites of account, feed, or feedback controllers
  - changing controller actions or state fields
  - changing store semantics

## Ownership

- owned files:
  - `packages/features/media-tools/src/controller/index.ts`
  - `packages/features/messages/src/controller/index.ts`
  - `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host files

## Dependencies

- depends on: `0287-core-state-snapshot-helpers`
- blocked by: none
- integration notes: helper adoption must be behavior-preserving and should not introduce a higher-level controller abstraction.

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

- slice gate: `pnpm verify:feature media-tools` and `pnpm verify:feature messages`
- generation needed: no
- final verifier handoff: `pnpm verify`

## Acceptance

- [x] media-tools controller clone state uses core snapshot helpers
- [x] messages controller clone state uses core snapshot helpers
- [x] public controller APIs and state fields remain unchanged
- [x] playbook records controller-level snapshot adoption guidance
- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Migrated media-tools controller state cloning to `cloneStateSnapshot` and `cloneStateSnapshotArray`.
- Migrated messages controller state cloning to the same core snapshot helpers.
- Kept controller APIs and state field names unchanged.
