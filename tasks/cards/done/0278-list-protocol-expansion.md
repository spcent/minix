# Card 0278 List Protocol Expansion

## Summary

Expand reusable list metadata for table, grid, grouped, saved-filter, and batch-action surfaces through the shared list protocol.

## Goal

Keep feed, order, message, content, and account lists aligned on `items`, `pagination`, `filters`, and `selectedItemId` without bespoke pagination shapes.

## Milestone

- milestone file: none
- slice name: `list protocol expansion`

## Priority

- priority: `P3`

## Scope

- In scope:
  - reusable table and grid render metadata
  - saved filters and restored query metadata
  - batch action descriptors and selection state
  - loading, empty, error, partial, skeleton, and retry state alignment
- Out of scope:
  - feature-specific pagination envelopes
  - host-only list state that bypasses shared protocol
  - route maps recreated by hand

## Ownership

- owned files:
  - `packages/contracts/src/kernel/common-page.ts`
  - `packages/core/src/page-protocols/list.ts`
  - `packages/features/*`
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- allowed generated outputs:
  - none unless host manifests change through source
- forbidden files:
  - manual generated output edits

## Dependencies

- depends on:
  - `tasks/cards/done/0218-list-protocol-adoption-audit.md`
  - `tasks/cards/done/0116-list-detail-business-state-expansion.md`
- blocked by:
  - feature-specific UI decisions for table and grid rendering
- integration notes:
  - rendering remains host UI responsibility; protocol owns state vocabulary

## Affected Paths

- `packages/contracts/src/kernel/common-page.ts`
- `packages/core/src/page-protocols/list.ts`
- `packages/features/*`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Related Specs

- `docs/ARCHITECTURE.md`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - additive-only
- store shape changes allowed:
  - additive-only in protocol adopters
- controller action changes allowed:
  - yes, where list adopters need saved-filter or batch-action handling
- route param changes allowed:
  - additive-only for persisted query state

## Verification

- slice gate:
  - targeted feature verification for each adopter changed
- generation needed:
  - none unless host manifests change
- final verifier handoff:
  - include examples for first load, refresh, append, retry, empty, partial, skeleton, filter, sort, and selection states

## Implementation Notes

- Added additive list render metadata, saved-filter descriptors, and batch-action descriptors to `packages/contracts/src/kernel/common-page.ts`.
- Extended `createListPageState` to default feed render metadata and preserve empty saved-filter and batch-action arrays while keeping canonical `items`, `pagination`, `filters`, and `selectedItemId` outputs unchanged.
- Covered the protocol defaults and explicit table/saved-filter/batch-action state in core page-protocol tests.
- Updated `docs/DOMAIN_COMPLETENESS_MATRIX.md` to record the expanded list posture.

## Verification Notes

- Ran `pnpm verify`.

## Acceptance

- [x] list outputs remain `items`, `pagination`, `filters`, and `selectedItemId`
- [x] no adopter introduces a custom pagination shape
- [x] saved-filter and batch-action behavior is protocol-aligned
- [x] host rendering remains separate from shared state
- [x] docs updated for protocol changes
- [x] `pnpm verify` run, or skipped with reason if docs-only
