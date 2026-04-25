# Lightweight Feature Snapshot Adoption

## Summary

Adopt core snapshot helpers in settings, catalog, and items initial-state clone paths.

## Goal

Lightweight reusable features should follow the same snapshot helper style as page protocols and larger workspace controllers, making them easier to reuse in other product matrices.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: lightweight feature snapshot adoption

## Scope

- In scope:
  - migrate settings model cloning to core snapshot helpers
  - migrate catalog initial-state cloning to core snapshot helpers
  - migrate items initial-model cloning to core snapshot helpers
  - update the product-matrix reuse playbook
- Out of scope:
  - changing feature state shapes or controller actions
  - rewriting every inline clone call in each feature
  - adding new abstractions beyond the existing snapshot helper

## Ownership

- owned files:
  - `packages/features/settings/src/controller/index.ts`
  - `packages/features/catalog/src/controller/index.ts`
  - `packages/features/items/src/controller/index.ts`
  - `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host files

## Dependencies

- depends on: `0291-form-workspace-controller-snapshot-adoption`
- blocked by: none
- integration notes: behavior-preserving helper adoption only.

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

- slice gate: `pnpm verify:feature settings`, `pnpm verify:feature catalog`, `pnpm verify:feature items`
- generation needed: no
- final verifier handoff: `pnpm verify`

## Acceptance

- [ ] settings clone path uses core snapshot helpers
- [ ] catalog clone path uses core snapshot helpers
- [ ] items clone path uses core snapshot helpers
- [ ] public feature APIs and state fields remain unchanged
- [ ] playbook records lightweight feature snapshot guidance
- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
