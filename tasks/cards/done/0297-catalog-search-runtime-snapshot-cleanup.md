# Catalog Search Runtime Snapshot Cleanup

Status: done

## Summary

Clean up catalog runtime search cloning and route-derived state projections.

## Goal

Catalog/search is a common product-matrix entry point. Runtime projections should use the same snapshot helpers as initial state so later products can copy the controller without inheriting mixed clone styles.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: catalog search runtime snapshot cleanup

## Scope

- In scope:
  - replace catalog runtime `structuredClone` search result cloning with snapshot helpers
  - normalize search query and filter projection cloning in `requestPage`
  - keep pagination, filter, and route sync behavior unchanged
  - update the product-matrix reuse playbook
- Out of scope:
  - changing search contracts
  - changing recommendation wording
  - touching API search behavior

## Ownership

- owned files:
  - `packages/features/catalog/src/controller/index.ts`
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

- `packages/features/catalog/src/controller/...`
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

- slice gate: `pnpm verify:feature catalog`
- generation needed: no
- final verifier handoff: `pnpm verify`

## Acceptance

- [x] catalog `createSearchResults` uses snapshot helpers
- [x] catalog `requestPage` query and filters use snapshot helpers
- [x] public feature APIs and state fields remain unchanged
- [x] playbook records runtime projection snapshot guidance
- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced catalog search result cloning with `cloneStateSnapshot`.
- Replaced runtime search query and filter projection cloning with core snapshot helpers.
- Kept catalog route sync, pagination, and state fields unchanged.
