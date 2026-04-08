# Card 0075 Message Notification Foundation

## Summary

Add the first shared message and notification domain for unread badges, notification lists, and reserved conversation threads.

## Goal

Create stable outputs for `notificationList`, `messageThread`, and `unreadBadge` so future host message surfaces do not invent incompatible local models.

## Milestone

- milestone file: none
- slice name: `message and notification foundation`

## Scope

- In scope:
  - add contracts for `notificationList`, `messageThread`, and `unreadBadge`
  - cover system notice, business notice, campaign notice, review notice, private message, consultation message, customer-service message, and reserved group-chat fields
  - cover unread count, read receipt, pinned state, do-not-disturb state, grouping, type filters, pagination, and batch mark-as-read behavior
  - reserve touchpoint metadata for in-app, subscription message, SMS, email, and push abstractions
  - build one feature package for notification/message list behavior
  - add sample API routes for notification list and unread badge behavior
  - adopt the surface in at least one official host manifest if the page addition stays small and reversible
- Out of scope:
  - real IM transport
  - push delivery vendor integrations
  - group chat or customer service systems beyond reserved contract fields

## Ownership

- owned files:
  - `packages/contracts/src/api/**`
  - new `packages/features/*` message-related package
  - `packages/core/src/page-protocols/list.ts`
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - selected host source manifests and page definitions
  - affected tests
- allowed generated outputs:
  - generated host manifests and shells if a page is added
- forbidden files:
  - unrelated payment or upload files

## Dependencies

- depends on:
  - `0071-user-account-domain-foundation.md`
- blocked by:
  - none
- integration notes:
  - keep notification and conversation contracts separate so notification UI does not lock in IM assumptions

## Affected Paths

- `packages/contracts/src/api/**`
- `packages/core/src/page-protocols/list.ts`
- new message feature package under `packages/features/*`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- selected host `page-definitions.ts`

## Related Specs

- `README.md`
- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, add message and notification contracts
- store shape changes allowed:
  - yes, in the new message feature state only
- controller action changes allowed:
  - yes, in the new message feature only
- route param changes allowed:
  - yes, for filters and thread selection if a page is added

## Verification

- slice gate:
  - sample routes and feature controller cover unread badge, list filtering, and batch read state transitions
- generation needed:
  - run generation if a host page is introduced
- final verifier handoff:
  - document notification versus conversation fields and what remains reserved
  - document which delivery channels are executable versus contract-only abstractions

## Acceptance

- [x] shared contracts cover notification list, thread summary, and unread badge outputs
- [x] shared contracts cover unread/read receipts, pinned/DND, grouping, filtering, and batch-read behavior
- [x] feature package stays platform-agnostic
- [x] host adoption, if added, is manifest-driven
- [x] `pnpm verify` run
