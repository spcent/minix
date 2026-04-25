# Core Page Protocol Snapshot Cleanup

Status: active

## Summary

Normalize remaining page protocol clone paths to the shared snapshot helper vocabulary.

## Goal

Core page protocols are reused by every product matrix. Detail and profile protocols should not keep separate clone idioms when the store snapshot helper already defines the shared behavior.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: core page protocol snapshot cleanup

## Scope

- In scope:
  - migrate detail status `entryEvidence` and `recovery` cloning to snapshot helpers
  - replace profile stat, section, and action clone helpers with `cloneStateSnapshotArray`
  - update the product-matrix reuse playbook if guidance changes
- Out of scope:
  - changing protocol state shapes
  - changing default labels or route behavior
  - touching generated host files

## Ownership

- owned files:
  - `packages/core/src/page-protocols/detail.ts`
  - `packages/core/src/page-protocols/profile.ts`
  - `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host files

## Dependencies

- depends on: `0287-core-state-snapshot-helpers`
- blocked by: none
- integration notes: behavior-preserving helper adoption only.

## Affected Paths

- `packages/core/src/page-protocols/...`
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

- slice gate: `pnpm test -- packages/core/src/page-protocols/*.test.ts`
- generation needed: no
- final verifier handoff: `pnpm verify`

## Acceptance

- [ ] detail status clone path uses snapshot helpers
- [ ] profile page protocol clone path uses snapshot helpers
- [ ] public core exports remain unchanged
- [ ] playbook records core protocol helper consistency if needed
- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
