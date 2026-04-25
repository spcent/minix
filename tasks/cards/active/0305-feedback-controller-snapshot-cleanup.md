# Feedback Controller Snapshot Cleanup

Status: active

## Summary

Replace remaining feedback controller clone calls with core snapshot helpers.

## Scope

- In scope: FAQ projections, ticket detail projections, ticket lists, support entries, draft values, and submission result snapshots.
- Out of scope: feedback contracts, upload pipeline, support workflow semantics.

## Ownership

- owned files: `packages/features/feedback/src/controller/index.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:feature feedback`
- final verifier handoff: `pnpm verify`

## Acceptance

- [ ] feedback controller response projections use core snapshot helpers
- [ ] feedback controller form/draft snapshots use core snapshot helpers
- [ ] public state shape remains unchanged
- [ ] playbook records feedback controller snapshot guidance
- [ ] `pnpm verify` run, or skipped with reason if docs-only
