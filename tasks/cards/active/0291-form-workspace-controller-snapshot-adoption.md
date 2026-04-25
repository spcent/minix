# Form Workspace Controller Snapshot Adoption

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

- [ ] account controller clone-state path uses core snapshot helpers
- [ ] feed controller clone-state path uses core snapshot helpers
- [ ] feedback controller clone-state path uses core snapshot helpers
- [ ] public controller APIs and state fields remain unchanged
- [ ] playbook records form/workspace controller snapshot guidance
- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
