# Feed Search Runtime Snapshot Cleanup

Status: active

## Summary

Normalize feed model and runtime search projection cloning to shared snapshot helpers.

## Goal

Feed/search is a reusable cross-domain product entry. It should follow the same snapshot convention as catalog so future product matrices can reuse list/search behavior without mixed clone styles.

## Scope

- In scope:
  - replace feed model tag clone helper with `cloneStateSnapshotArray`
  - replace feed runtime `structuredClone` search result, query, filter, tag, and draft value clones where practical
  - keep route writeback, pagination, content draft, and review queue behavior unchanged
  - update the product-matrix reuse playbook
- Out of scope:
  - changing feed contracts
  - changing content governance or draft workflow semantics
  - changing API feed behavior

## Ownership

- owned files:
  - `packages/features/feed/src/model/index.ts`
  - `packages/features/feed/src/controller/index.ts`
  - `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host files

## Verification

- slice gate: `pnpm verify:feature feed`
- generation needed: no
- final verifier handoff: `pnpm verify`

## Acceptance

- [ ] feed model tags use core snapshot helpers
- [ ] feed runtime search projections use core snapshot helpers
- [ ] feed content draft value snapshots use core snapshot helpers where practical
- [ ] public feature APIs and state fields remain unchanged
- [ ] playbook records feed/search snapshot guidance
- [ ] change is local and reversible
- [ ] `pnpm verify` run, or skipped with reason if docs-only
