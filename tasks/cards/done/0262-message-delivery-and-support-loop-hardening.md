# Card 0262 Message Delivery And Support Loop Hardening

## Summary

Improve message-delivery transparency and support-thread continuity across inbox and feedback without reintroducing transport-specific forks.

## Goal

Make notification delivery, customer-support follow-up, and operator-action visibility clearer inside the current messages and feedback model.

## Milestone

- milestone file: none
- slice name: `message delivery and support loop hardening`

## Priority

- priority: `P2`

## Scope

- In scope:
  - delivery-attempt and fallback-reason summaries for notification channels
  - clearer customer-support thread posture shared between inbox and feedback
  - bounded message-template governance for subscription, SMS, email, and push channels
  - stronger feedback triage, revisit posture, and operator-action audit visibility
- Out of scope:
  - a realtime transport rewrite
  - a separate support-console host

## Ownership

- owned files:
  - `docs/ROADMAP.md`
  - `docs/BACKEND_CONTRACT.md`
  - `packages/contracts/src/api/message.ts`
  - `packages/contracts/src/api/feedback.ts`
  - `packages/features/messages`
  - `packages/features/feedback`
  - `apps/api/src/domains/messages`
  - `apps/api/src/domains/feedback`
- allowed generated outputs:
  - none
- forbidden files:
  - host-local delivery-state or support-thread models

## Dependencies

- depends on:
  - `tasks/cards/active/0242-message-provider-rollout-and-polling-acceptance.md`
  - `tasks/cards/done/0252-cross-domain-context-envelope-audit.md`
- blocked by:
  - final release closure for the current `P0` queue
- integration notes:
  - preserve polling-only sync as an explicit transport decision unless a separate scope decision is made

## Affected Paths

- `docs/ROADMAP.md`
- `docs/BACKEND_CONTRACT.md`
- `packages/contracts/src/api/message.ts`
- `packages/contracts/src/api/feedback.ts`
- `packages/features/messages`
- `packages/features/feedback`
- `apps/api/src/domains/messages`
- `apps/api/src/domains/feedback`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Interface Notes

- contract changes allowed:
  - yes, additive-only for delivery and support-loop visibility
- store shape changes allowed:
  - yes, when messages or feedback need clearer shared state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - none

## Verification

- slice gate:
  - delivery and support-loop visibility improves without changing the shared transport boundary
- generation needed:
  - none
- final verifier handoff:
  - include delivery summary additions, support-loop posture, and any polling-transport constraints

## Acceptance

- [x] message delivery attempts and fallback reasons are clearer in normalized shared outputs
- [x] inbox and feedback share a coherent support-thread posture
- [x] template governance and operator-action visibility remain additive
- [x] no transport-specific or host-local fork is introduced
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added additive message and feedback fields in `packages/contracts/src/api/message.ts` and `packages/contracts/src/api/feedback.ts` for touchpoint delivery summaries, receipt-attempt summaries, template-governance posture, and shared support-loop summaries.
- Extended `apps/api/src/domains/messages/touchpoints.ts` and `apps/api/src/domains/messages/threads.ts` so notifications, thread messages, and customer-service threads expose normalized delivery-attempt, fallback, and operator-action posture without changing the polling-only transport boundary.
- Extended `apps/api/src/domains/feedback/support.ts` and `packages/features/feedback/src/controller/index.ts` so feedback bootstrap and ticket status reuse the same shared support-thread vocabulary as inbox threads instead of inventing a feedback-only support model.
- Synced `docs/BACKEND_CONTRACT.md` and `docs/ROADMAP.md` to reflect the stronger message-delivery and support-loop baseline.

## Verification Notes

- `node --import tsx --test packages/features/messages/src/controller/index.test.ts`
- `node --import tsx --test packages/features/feedback/src/controller/index.test.ts`
- `node --import tsx --test apps/api/src/app.test.ts`
- `pnpm verify`
