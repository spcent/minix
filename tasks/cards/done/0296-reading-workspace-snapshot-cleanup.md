# Reading Workspace Snapshot Cleanup

Status: done

## Summary

Normalize initial-state cloning across bookshelf, novel detail, reader, and toc controllers.

## Goal

Reading workflows form a reusable content-product matrix. Their controllers should share a clear snapshot strategy for lists, detail data, milestone history, and chapter state.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: reading workspace snapshot cleanup

## Scope

- In scope:
  - migrate bookshelf initial-state clone arrays and pinned item to snapshot helpers
  - migrate novel-detail detail data, status, and actions cloning to snapshot helpers
  - migrate reader chapter and read-id cloning to snapshot helpers
  - migrate toc volume and read-id cloning to snapshot helpers
  - update the product-matrix reuse playbook
- Out of scope:
  - changing reading progress behavior
  - changing route recovery, membership, or bookshelf mutation flows
  - adding new page protocols

## Ownership

- owned files:
  - `packages/features/bookshelf/src/controller/index.ts`
  - `packages/features/novel-detail/src/controller/index.ts`
  - `packages/features/reader/src/controller/index.ts`
  - `packages/features/toc/src/controller/index.ts`
  - `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host files

## Dependencies

- depends on: `0293-lightweight-feature-snapshot-adoption`
- blocked by: none
- integration notes: behavior-preserving helper adoption only.

## Affected Paths

- `packages/features/bookshelf/...`
- `packages/features/novel-detail/...`
- `packages/features/reader/...`
- `packages/features/toc/...`
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

- slice gate: `pnpm verify:feature bookshelf`, `pnpm verify:feature novel-detail`, `pnpm verify:feature reader`, `pnpm verify:feature toc`
- generation needed: no
- final verifier handoff: `pnpm verify`

## Acceptance

- [x] bookshelf initial-state clone path uses core snapshot helpers
- [x] novel-detail initial-state clone path uses core snapshot helpers
- [x] reader initial-state clone path uses core snapshot helpers
- [x] toc initial-state clone path uses core snapshot helpers
- [x] public feature APIs and state fields remain unchanged
- [x] playbook records reading workspace snapshot guidance
- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Migrated bookshelf initial-state arrays and pinned item to core snapshot helpers.
- Migrated novel-detail initial detail/status/action cloning to core snapshot helpers.
- Migrated reader chapter and read-id cloning to core snapshot helpers.
- Migrated toc volume and read-id cloning to core snapshot helpers.
