# Card 0283 Feedback Support Expansion

## Summary

Expand feedback SLA, queue, support-thread handoff, handling reports, and revisit workflows through the existing feedback domain.

## Goal

Keep issue reports, suggestions, complaints, abuse reports, satisfaction feedback, FAQ, tickets, and support loops aligned on `feedbackTicket`, `feedbackCategory`, and `feedbackStatus`.

## Milestone

- milestone file: none
- slice name: `feedback support expansion`

## Priority

- priority: `P2`

## Scope

- In scope:
  - SLA rules and queue dashboards
  - support-thread handoff summaries
  - operator handling reports and processing history
  - revisit and satisfaction workflow refinement
- Out of scope:
  - feedback-specific message delivery outside the messages touchpoint model
  - a second ticket system
  - host-only feedback state

## Ownership

- owned files:
  - `packages/contracts/src/api/feedback.ts`
  - `packages/features/feedback`
  - `apps/api/src/domains/feedback`
  - `apps/api/src/domains/messages`
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- allowed generated outputs:
  - regenerated manifests or shells only if host source manifests change
- forbidden files:
  - generated output edits by hand

## Dependencies

- depends on:
  - `tasks/cards/done/0223-feedback-host-support-surface-closure.md`
  - `tasks/cards/done/0091-feedback-service-loop-and-customer-support-surface.md`
- blocked by:
  - support SLA and queue ownership decisions
- integration notes:
  - message delivery and support-thread transport remain owned by the messages touchpoint model

## Affected Paths

- `packages/contracts/src/api/feedback.ts`
- `packages/features/feedback`
- `apps/api/src/domains/feedback`
- `apps/api/src/domains/messages`
- `apps/*/src/manifest/page-definitions.ts`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `specs/dependency-rules.yaml`
- `specs/ownership.yaml`

## Interface Notes

- contract changes allowed:
  - additive-only
- store shape changes allowed:
  - additive-only in feedback state
- controller action changes allowed:
  - yes, for existing feedback and support-entry actions
- route param changes allowed:
  - additive-only within existing feedback routes

## Verification

- slice gate:
  - `pnpm verify:feature feedback`
- generation needed:
  - none unless host manifests change
- final verifier handoff:
  - include bootstrap, submit, list, detail, revisit, action, FAQ, support-entry, queue, SLA, and processing-history examples

## Implementation Notes

- Added shared SLA rule, queue dashboard, support handoff, and handling report descriptors to the feedback contract.
- Derived SLA, queue, handoff, and handling-report metadata in the feedback API while keeping support-thread transport on the existing messages touchpoint model.
- Surfaced queue dashboards, SLA rules, and latest handling report in the feedback controller state.
- Updated `docs/DOMAIN_COMPLETENESS_MATRIX.md` to record the expanded feedback support posture.

## Verification Notes

- Ran `pnpm verify:feature feedback`.
- Ran `pnpm test`.

## Acceptance

- [x] feedback outputs remain `feedbackTicket`, `feedbackCategory`, and `feedbackStatus`
- [x] support-thread delivery stays aligned with message touchpoints
- [x] context capture keeps page, user, device, version, screenshot, and attachment data explicit
- [x] queue and SLA changes are documented
- [x] docs updated for workflow or support posture changes
- [x] `pnpm verify` run, or skipped with reason if docs-only
