# Card 0068 Gap Closure Sequencing

## Summary

Turn the audit findings into a dependency-ordered execution plan so contracts, features, and host manifests expand in a controlled order instead of widening the product surface ad hoc.

## Goal

Provide one source of truth for the next capability slices and their sequencing across `packages/contracts`, `packages/features/*`, platform/runtime touch points, and host manifest adoption.

## Milestone

- milestone file: none
- slice name: `business gap closure sequencing`

## Scope

- In scope:
  - define the recommended execution order for the next capability slices
  - record which slices are prerequisites for later host-visible work
  - keep the sequence aligned with the current shared-kernel architecture
- Out of scope:
  - implementing any business feature
  - changing existing route ids or generated host outputs

## Ownership

- owned files:
  - `tasks/cards/active/0068-gap-closure-sequencing.md`
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/**`
  - `apps/**`

## Dependencies

- depends on:
  - the audit result from the current thread
- blocked by:
  - none
- integration notes:
  - execute the slices in numeric order unless a later card explicitly says it can run in parallel

## Affected Paths

- `tasks/cards/active/0068-gap-closure-sequencing.md`
- `tasks/cards/active/0069-auth-identity-contract-hardening.md`
- `tasks/cards/active/0070-auth-route-enforcement-and-redirect-unification.md`
- `tasks/cards/active/0071-user-account-domain-foundation.md`
- `tasks/cards/active/0072-settings-domain-normalization.md`
- `tasks/cards/active/0073-search-and-feed-surface-foundation.md`
- `tasks/cards/active/0074-payment-order-foundation.md`
- `tasks/cards/active/0075-message-notification-foundation.md`
- `tasks/cards/active/0076-upload-share-foundation.md`
- `tasks/cards/active/0077-feedback-ticket-foundation.md`
- `tasks/cards/active/0078-content-domain-foundation.md`
- `tasks/cards/active/0079-list-and-detail-domain-hardening.md`
- `tasks/cards/active/0080-form-workflow-foundation.md`

## Related Specs

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`
- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - none
- controller action changes allowed:
  - none
- route param changes allowed:
  - none

## Verification

- slice gate:
  - the ordered card set clearly separates prerequisite domain work from later host adoption work
- generation needed:
  - none
- final verifier handoff:
  - confirm the next implementation branch starts from `0069` and not from a later dependent slice
  - confirm every audited capability domain has a corresponding task card before implementation starts

## Acceptance

- [ ] sequence starts with auth and user domain hardening before adding new host-visible business surfaces
- [ ] later slices do not bypass shared contracts by writing directly into host-only state
- [ ] auth, routing, user, settings, message, payment, content, search, list/detail, form, upload/share, and feedback all have explicit follow-up cards
- [ ] cards stay local, reversible, and architecture-aligned
