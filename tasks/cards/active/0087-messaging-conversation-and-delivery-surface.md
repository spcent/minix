# Card 0087 Messaging Conversation And Delivery Surface

## Summary

Expand the message domain from notification list and thread summary into fuller conversation, delivery, and customer-service-ready workflows.

## Goal

Support message threads as actual business conversations rather than only unread badge and thread-preview data.

## Milestone

- milestone file: none
- slice name: `messaging conversation surface`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add message-body list and thread-detail contracts where needed
  - support private, consultation, and customer-service conversation flows beyond reserved thread summary
  - support read-state transitions and thread-level retrieval for real message bodies
  - add explicit separation between notification feed and conversation surface
  - keep group-chat support reserved unless a bounded sample is needed
  - preserve delivery-channel abstractions without leaking vendor logic into shared features
- Out of scope:
  - real IM transport infra
  - production push/SMS/email vendor delivery
  - fully featured group chat

## Ownership

- owned files:
  - `packages/contracts/src/api/message.ts`
  - `packages/features/messages/src/**`
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - selected host source manifests and page definitions
  - affected tests
- allowed generated outputs:
  - generated manifests and shells if host pages are added or expanded
- forbidden files:
  - unrelated payment or upload files unless required for shared touchpoint integration

## Dependencies

- depends on:
  - `0075-message-notification-foundation.md`
  - `0071-user-account-domain-foundation.md`
- blocked by:
  - none
- integration notes:
  - keep notifications, thread summaries, and thread messages as related but distinct shared outputs

## Affected Paths

- `packages/contracts/src/api/message.ts`
- `packages/features/messages/src/model/index.ts`
- `packages/features/messages/src/controller/index.ts`
- `packages/features/messages/src/feature.manifest.ts`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- optional `apps/*/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for thread-detail and delivery-state refinement
- store shape changes allowed:
  - yes, in messages feature state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for thread selection and conversation entry context

## Verification

- slice gate:
  - sample API and shared feature can open a thread and surface real message-body state
- generation needed:
  - run generation only if host source manifests change
- final verifier handoff:
  - record notification-only versus conversation-capable surfaces explicitly

## Acceptance

- [x] message threads can expose real message-body state, not only summary rows
- [x] consultation and customer-service thread types have bounded sample behavior
- [x] notification and conversation surfaces remain separated in shared contracts
- [x] delivery and read-state abstractions stay platform-agnostic
- [x] `pnpm verify` run
