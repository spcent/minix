# API Message Thread Snapshot Cleanup

Status: active

## Summary

Adopt API-domain snapshot helpers for message thread nested state clones.

## Ownership

- owned files: `apps/api/src/domains/messages/threads.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] message thread assignment/progress/context clones use API snapshot helpers
- [ ] message response envelopes remain unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
