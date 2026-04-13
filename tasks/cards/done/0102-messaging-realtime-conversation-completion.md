# Card 0102 Messaging Realtime Conversation Completion

## Summary

Turn reserved message threads into complete private, consultation, customer-service, and group conversation workflows.

## Goal

Provide full conversation read/write lifecycle, thread list management, delivery status, real-time or polling updates, support assignment, consultation state, and group membership controls.

## Milestone

- milestone file: none
- slice name: `messaging realtime conversation completion`

## Priority

- priority: `P0`

## Scope

- In scope:
  - implement thread list, thread creation, send status, retry, failure, read receipts, and unread aggregation
  - complete private message and consultation message flows
  - complete customer-service assignment and support reply workflow
  - add group membership, permission, and no-reply/readonly states
  - add real-time channel or documented polling strategy with recovery behavior
- Out of scope:
  - vendor push/email/SMS delivery, covered by `0114`

## Ownership

- owned files:
  - `packages/contracts/src/api/message.ts`
  - `packages/features/messages/src/**`
  - `packages/features/feedback/src/**`
  - `apps/api/src/app.ts`
  - `apps/api/src/store*.ts`
  - `apps/host-h5/src/manifest/page-definitions.ts`
  - `apps/host-wechat/src/manifest/page-definitions.ts`
  - message tests
- allowed generated outputs:
  - regenerated manifests and shells only if pages change
- forbidden files:
  - generated host files as source edits

## Dependencies

- depends on:
  - `0087-messaging-conversation-and-delivery-surface.md`
  - `0111-feedback-ticketing-and-support-ops-console.md`
- blocked by:
  - real-time transport decision if live delivery is required
- integration notes:
  - preserve notification center compatibility while adding real conversation state

## Affected Paths

- `packages/contracts/src/api/message.ts`
- `packages/features/messages/src/controller/index.ts`
- `packages/features/feedback/src/controller/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- `apps/api/src/store.ts`
- `apps/api/src/store.d1.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for delivery status, thread membership, support assignment, and real-time cursors
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for thread ids and message cursors

## Verification

- slice gate:
  - at least private, consultation, and customer-service threads support complete send/read/retry/recovery behavior
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat pages change
- final verifier handoff:
  - document whether real-time delivery or polling is used

## Acceptance

- [x] conversation list and detail are both backed by durable state
- [x] sending tracks pending, delivered, failed, and retry states
- [x] customer-service and consultation flows have assignment/progress state
- [x] group threads enforce membership and reply permissions
- [x] unread/read receipts remain correct across thread operations
- [x] `pnpm verify` run
