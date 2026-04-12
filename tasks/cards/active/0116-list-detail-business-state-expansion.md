# Card 0116 List Detail Business State Expansion

## Summary

Apply shared list/detail protocols consistently across business domains and edge states.

## Goal

Ensure content, orders, messages, feedback, relationships, and account-related lists/details all support loading, empty, error, partial, deleted, unavailable, unauthorized, and deep-link recovery states.

## Milestone

- milestone file: none
- slice name: `list detail business state expansion`

## Priority

- priority: `P2`

## Scope

- In scope:
  - standardize list state for pagination, refresh, retry, skeleton, partial data, filters, sort, and selection
  - standardize detail state for stale, deleted, offline, permission denied, unavailable, and recovered-from-link
  - adopt common protocols in at least three business feature surfaces beyond current feed/detail samples
  - add route param restoration for list filters and selected detail ids
  - add tests for empty/error/partial/deleted/permission states
- Out of scope:
  - feature-specific business mutations already covered by domain cards

## Ownership

- owned files:
  - `packages/contracts/src/kernel/common-page.ts`
  - `packages/core/src/page-protocols/list.ts`
  - `packages/core/src/page-protocols/detail.ts`
  - affected feature packages under `packages/features/*`
  - host manifest page definitions if new pages are introduced
  - list/detail tests
- allowed generated outputs:
  - regenerated manifests and shells only if pages change
- forbidden files:
  - generated host files as source edits

## Dependencies

- depends on:
  - `0093-list-detail-adoption-expansion.md`
  - `0102-messaging-realtime-conversation-completion.md`
  - `0115-order-sku-subscription-and-after-sales-expansion.md`
- blocked by:
  - none
- integration notes:
  - prefer extending existing common protocols over feature-specific duplicate status shapes

## Affected Paths

- `packages/contracts/src/kernel/common-page.ts`
- `packages/core/src/page-protocols/list.ts`
- `packages/core/src/page-protocols/detail.ts`
- `packages/features/*/src/**`

## Related Specs

- `docs/ARCHITECTURE.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for shared list/detail status and recovery metadata
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for filters, sort, pagination cursor, and selected detail id

## Verification

- slice gate:
  - three business domains use the shared list/detail states without ad hoc duplicates
- generation needed:
  - none unless pages are added
- final verifier handoff:
  - include adoption matrix by feature
  - adopted features in this slice:
    - `feed`: route-restored query/sort/selection list state
    - `messages`: deep-link recovery plus unavailable/offline/forbidden detail mapping
    - `items`: empty and stale list handling on shared list status
    - `subscription`: order list and commerce detail status normalization

## Acceptance

- [x] shared list states cover loading/empty/error/partial/skeleton/retry
- [x] shared detail states cover deleted/offline/permission/stale/deep-link recovery
- [x] at least three domain features adopt the common states
- [x] route restoration works for filters and selected detail ids
- [x] tests cover list/detail edge-state matrix
- [x] `pnpm verify` run
