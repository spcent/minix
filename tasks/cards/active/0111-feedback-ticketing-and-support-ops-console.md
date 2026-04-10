# Card 0111 Feedback Ticketing And Support Ops Console

## Summary

Turn feedback ticket sample flow into a real support service loop and operations surface.

## Goal

Support FAQ, ticket creation, triage, assignment, progress updates, support conversation, revisit, priority, tags, callback, and closure.

## Milestone

- milestone file: none
- slice name: `feedback ticketing and support ops console`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add ticket list/detail and support operator actions
  - support category, tag, priority, handler, SLA, revisit, and processing history
  - connect ticket follow-up to customer-service messages
  - add FAQ selection and support-entry routing as durable data, not only sample defaults
  - add tests for triage, assignment, progress, revisit, close, and support-message sync
- Out of scope:
  - third-party helpdesk integration unless selected for this slice

## Ownership

- owned files:
  - `packages/contracts/src/api/feedback.ts`
  - `packages/contracts/src/api/message.ts`
  - `packages/features/feedback/src/**`
  - `packages/features/messages/src/**`
  - `apps/api/src/app.ts`
  - `apps/api/src/store*.ts`
  - host manifest page definitions if new pages are introduced
- allowed generated outputs:
  - regenerated manifests and shells only if pages change
- forbidden files:
  - generated host files as source edits

## Dependencies

- depends on:
  - `0091-feedback-service-loop-and-customer-support-surface.md`
  - `0102-messaging-realtime-conversation-completion.md`
- blocked by:
  - support role and operator surface decision
- integration notes:
  - feedback remains feature-owned; messaging provides conversation transport

## Affected Paths

- `packages/contracts/src/api/feedback.ts`
- `packages/features/feedback/src/controller/index.ts`
- `packages/features/messages/src/controller/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for ticket queue, SLA, assignee, tags, priority, and support action results
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for ticket id, queue filter, and support thread target

## Verification

- slice gate:
  - a ticket can progress from submit to triage, assignment, follow-up, revisit, and closure
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat pages change
- final verifier handoff:
  - include user-side and support-side flows

## Acceptance

- [ ] ticket list and detail are implemented
- [ ] triage, assignment, priority, tag, and SLA fields are durable
- [ ] support conversation syncs with message threads
- [ ] revisit and closure update processing history
- [ ] FAQ/support entry data is configurable and durable
- [ ] `pnpm verify` run
