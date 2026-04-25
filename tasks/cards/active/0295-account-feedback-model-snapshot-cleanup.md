# Account Feedback Model Snapshot Cleanup

Status: active

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

- [ ] account model factory clone path uses core snapshot helpers
- [ ] feedback value defaults use core snapshot helpers
- [ ] feedback bootstrap projection uses core snapshot helpers
- [ ] public feature APIs and state fields remain unchanged
- [ ] playbook records model factory snapshot guidance
- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
