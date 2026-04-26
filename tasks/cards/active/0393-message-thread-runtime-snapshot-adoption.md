# Message Thread Runtime Snapshot Adoption

Status: active

## Summary

Use shared message snapshot helpers in the message thread runtime.

## Goal

`threads.ts` should no longer own private message member, thread, body item, and item-array clone helpers.

## Scope

- In scope:
  - import shared snapshot helpers in `apps/api/src/domains/messages/threads.ts`
  - remove private duplicate clone helpers
  - preserve message thread response shapes
- Out of scope:
  - changing touchpoint dispatch behavior
  - changing thread creation or sync semantics

## Ownership

- owned files:
  - `apps/api/src/domains/messages/threads.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] runtime imports shared snapshot helpers
- [ ] private duplicate clone helpers are removed
- [ ] API tests still pass
- [ ] `pnpm verify` run, or skipped with reason if docs-only
