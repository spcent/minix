# Product Matrix Reuse Playbook

Status: done

## Summary

Document a reusable product-matrix adoption playbook so new products can map MiniX domains to existing contracts, controllers, manifests, and verification gates without inventing host-local shapes.

## Goal

Future product matrices should start from a documented mapping path:

- requested capability row
- owning contract and feature controller
- API domain envelope
- official host manifest entry
- verification and release-evidence expectation

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: matrix reuse guidance

## Scope

- In scope:
  - add a doc that explains how to reuse MiniX domains for another product matrix
  - call out code-reuse recommendations and anti-patterns discovered in the current audit
  - link the playbook from the domain completeness matrix
- Out of scope:
  - adding a new product family
  - adding new host apps
  - changing generated host registries

## Ownership

- owned files:
  - `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - `apps/*/src/render/page-registry.ts`
  - `apps/host-wechat/miniprogram/**`

## Dependencies

- depends on: `0271` to `0283` capability expansion cards
- blocked by: none
- integration notes: keep guidance additive to the frozen `v1.0.0` app surface.

## Affected Paths

- `docs/...`
- `tasks/cards/...`

## Related Specs

- `docs/AGENT_GUIDE.md`
- `docs/ARCHITECTURE.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Interface Notes

- contract changes allowed: none
- store shape changes allowed: none
- controller action changes allowed: none
- route param changes allowed: none

## Verification

- slice gate: docs-only review
- generation needed: no
- final verifier handoff: `pnpm verify` may be skipped with reason if this remains docs-only

## Acceptance

- [x] playbook covers contracts, feature controllers, API domains, host manifests, and verification
- [x] recommendations are grounded in current code ownership boundaries
- [x] matrix doc links to the playbook
- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md` with a capability-to-owner reuse path, product intake checklist, card grouping guidance, and current audit recommendations.
- Linked the playbook from `docs/DOMAIN_COMPLETENESS_MATRIX.md`.
- Skipped `pnpm verify` for this card because the change is docs-only.
