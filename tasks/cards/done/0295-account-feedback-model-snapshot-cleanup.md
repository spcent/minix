# Account Feedback Model Snapshot Cleanup

Status: done

## Summary

Adopt shared snapshot helpers in account and feedback model factories.

## Goal

Account and feedback are reusable product-matrix anchors for identity, service, and support workflows. Their model factories should use the same data-copy convention as controllers and page protocols.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: account feedback model snapshot cleanup

## Scope

- In scope:
  - replace account model manual stat, section, and action clone helpers with snapshot helpers
  - replace feedback value and bootstrap `structuredClone` calls with snapshot helpers
  - preserve existing model defaults and optional field behavior
  - update the product-matrix reuse playbook
- Out of scope:
  - changing form values or feedback bootstrap contracts
  - changing controller behavior
  - adding new model abstractions

## Ownership

- owned files:
  - `packages/features/account/src/model/index.ts`
  - `packages/features/feedback/src/model/index.ts`
  - `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host files

## Dependencies

- depends on: `0289-feature-controller-snapshot-adoption`
- blocked by: none
- integration notes: behavior-preserving helper adoption only.

## Affected Paths

- `packages/features/account/src/model/...`
- `packages/features/feedback/src/model/...`
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

- slice gate: `pnpm verify:feature account`, `pnpm verify:feature feedback`
- generation needed: no
- final verifier handoff: `pnpm verify`

## Acceptance

- [x] account model factory clone path uses core snapshot helpers
- [x] feedback value defaults use core snapshot helpers
- [x] feedback bootstrap projection uses core snapshot helpers
- [x] public feature APIs and state fields remain unchanged
- [x] playbook records model factory snapshot guidance
- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced account model manual clone helpers with `cloneStateSnapshotArray`.
- Replaced feedback default asset and bootstrap projection cloning with core snapshot helpers.
- Kept account and feedback state shapes unchanged.
