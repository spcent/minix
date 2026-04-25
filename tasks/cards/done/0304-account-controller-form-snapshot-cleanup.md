# Account Controller Form Snapshot Cleanup

Status: done

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

- [x] account controller form snapshots use core helpers
- [x] public state shape remains unchanged
- [x] playbook records account form snapshot guidance
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced account operation form, initial, draft, and reset value clones with `cloneStateSnapshot`.
- Kept account operation workflow and public state shape unchanged.
