# API Message Thread Snapshot Cleanup

Status: done

## Summary

Adopt API-domain snapshot helpers for message thread nested state clones.

## Ownership

- owned files: `apps/api/src/domains/messages/threads.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] message thread assignment/progress/context clones use API snapshot helpers
- [x] message response envelopes remain unchanged
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced message thread nested assignment, progress, sync, source context, and actor context clones with `cloneDomainSnapshot`.
- Kept message response envelopes unchanged.
