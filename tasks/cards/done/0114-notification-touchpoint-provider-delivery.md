# Card 0114 Notification Touchpoint Provider Delivery

## Summary

Implement real delivery providers for subscription messages, SMS, email, and push beyond the current station-message abstraction.

## Goal

Provide template management, dispatch, delivery receipts, failure handling, user preferences, and unsubscribe controls for all notification touchpoints.

## Milestone

- milestone file: none
- slice name: `notification touchpoint provider delivery`

## Priority

- priority: `P2`

## Scope

- In scope:
  - add provider dispatch contracts for subscription message, SMS, email, and push
  - add template selection, locale/channel constraints, delivery receipt, and retry state
  - enforce notification preferences and unsubscribe controls
  - surface delivery status in message/notification state
  - add tests for provider unavailable, opt-out, retry, and receipt handling
- Out of scope:
  - real-time in-app conversation transport, covered by `0102`

## Ownership

- owned files:
  - `packages/contracts/src/api/message.ts`
  - `packages/contracts/src/api/settings.ts`
  - `packages/features/messages/src/**`
  - `packages/features/settings/src/**`
  - platform adapters if host-native push/subscription APIs are used
  - `apps/api/src/app.ts`
  - notification tests
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests and shells

## Dependencies

- depends on:
  - `0102-messaging-realtime-conversation-completion.md`
  - `0107-settings-business-policy-center.md`
- blocked by:
  - selected SMS/email/push/subscription providers
- integration notes:
  - delivery failure must not break station-message persistence

## Affected Paths

- `packages/contracts/src/api/message.ts`
- `packages/contracts/src/api/settings.ts`
- `packages/features/messages/src/controller/index.ts`
- `packages/features/settings/src/controller/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`

## Interface Notes

- contract changes allowed:
  - yes, for templates, dispatch results, receipts, opt-out, and retry state
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - no

## Verification

- slice gate:
  - touchpoint dispatch respects preferences and records provider outcomes
- generation needed:
  - none
- final verifier handoff:
  - include provider matrix and opt-out behavior

## Acceptance

- [x] subscription message, SMS, email, and push channels have provider abstractions
- [x] delivery templates and receipts are persisted
- [x] user preferences and unsubscribe controls are enforced
- [x] retries and provider failures are visible
- [x] station-message fallback remains available
- [x] `pnpm verify` run
