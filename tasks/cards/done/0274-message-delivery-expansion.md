# Card 0274 Message Delivery Expansion

## Summary

Expand message provider receipts, support-loop metadata, consultation state, and polling acceptance through the existing messages domain.

## Goal

Improve station notifications, message threads, unread badges, and touchpoint evidence without claiming realtime delivery before a non-polling provider exists.

## Milestone

- milestone file: none
- slice name: `message delivery expansion`

## Priority

- priority: `P2`

## Scope

- In scope:
  - provider receipt history and retry summaries
  - richer support and consultation thread metadata
  - explicit polling interval and release acceptance fields
  - unread badge and mark-read validation across notification and thread lists
- Out of scope:
  - unbounded realtime claims
  - committed delivery provider secrets
  - a second messages store outside `packages/features/messages`

## Ownership

- owned files:
  - `packages/contracts/src/api/message.ts`
  - `packages/features/messages`
  - `apps/api/src/domains/messages`
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- allowed generated outputs:
  - regenerated manifests or shells only if host source manifests change
- forbidden files:
  - provider credentials, generated outputs edited by hand

## Dependencies

- depends on:
  - `tasks/cards/active/0242-message-provider-rollout-and-polling-acceptance.md`
  - `tasks/cards/done/0262-message-delivery-and-support-loop-hardening.md`
- blocked by:
  - provider rollout and product decision on polling-only release posture
- integration notes:
  - keep shared outputs as `notificationList`, `messageThread`, and `unreadBadge`

## Affected Paths

- `packages/contracts/src/api/message.ts`
- `packages/features/messages`
- `apps/api/src/domains/messages`
- `apps/*/src/manifest/page-definitions.ts`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - additive-only
- store shape changes allowed:
  - additive-only
- controller action changes allowed:
  - yes, for existing inbox and thread flows
- route param changes allowed:
  - additive-only if needed for existing message routes

## Verification

- slice gate:
  - `pnpm verify:feature messages`
- generation needed:
  - none unless host manifests change
- final verifier handoff:
  - include notification list, thread detail, unread badge, mark-read, send, retry, and sync examples

## Acceptance

- [x] provider delivery posture and polling status are explicit
- [x] unread and read-receipt behavior remains consistent across list and detail flows
- [x] message touchpoints remain the shared delivery abstraction
- [x] no realtime behavior is documented unless implemented and verified
- [x] release docs updated when provider acceptance changes
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added additive `MessageDeliveryPosture` output with provider mode, polling interval, realtime posture, receipt history, retry counts, and support/consultation summaries.
- Threaded delivery posture through notification list, thread list, thread detail, create, send, retry, and sync responses.
- Stored delivery posture in the shared messages controller state without adding a second messages store.
- Kept realtime explicitly unprovisioned and polling-only in the contract summary.

## Verification Notes

- Ran `pnpm verify:feature messages`.
