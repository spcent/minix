# Account Controller Form Snapshot Cleanup

Status: active

## Summary

Replace remaining account controller form `structuredClone` calls with core snapshot helpers.

## Scope

- In scope: account operation form values, initial values, draft values, and reset values.
- Out of scope: account operation contracts, relation flows, asset ledger behavior.

## Ownership

- owned files: `packages/features/account/src/controller/index.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:feature account`
- final verifier handoff: `pnpm verify`

## Acceptance

- [ ] account controller form snapshots use core helpers
- [ ] public state shape remains unchanged
- [ ] playbook records account form snapshot guidance
- [ ] `pnpm verify` run, or skipped with reason if docs-only
