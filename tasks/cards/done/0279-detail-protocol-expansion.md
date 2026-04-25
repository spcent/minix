# Card 0279 Detail Protocol Expansion

## Summary

Expand shared detail action, attachment, comment, stale-state, and recovery metadata through the detail protocol.

## Goal

Keep content, order, account, message, consultation, and tool-result details aligned on `detailData`, `detailStatus`, and `detailActions`.

## Milestone

- milestone file: none
- slice name: `detail protocol expansion`

## Priority

- priority: `P3`

## Scope

- In scope:
  - shared comment, attachment, and action descriptors
  - stale and unavailable recovery copy
  - list, share, deep-link, and unknown entry-context evidence
  - permission denied, offline, deleted, and unpublished status alignment
- Out of scope:
  - one-off detail status enums
  - a second detail protocol
  - rewriting reader-specific documented exceptions

## Ownership

- owned files:
  - `packages/contracts/src/kernel/common-page.ts`
  - `packages/core/src/page-protocols/detail.ts`
  - `packages/features/*`
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- allowed generated outputs:
  - none unless host manifests change through source
- forbidden files:
  - manual generated output edits

## Dependencies

- depends on:
  - `tasks/cards/done/0219-detail-protocol-adoption-audit.md`
  - `tasks/cards/done/0116-list-detail-business-state-expansion.md`
- blocked by:
  - domain decisions for comments and attachment rendering
- integration notes:
  - reader and embedded details can remain explicit exceptions, but exceptions must stay documented

## Affected Paths

- `packages/contracts/src/kernel/common-page.ts`
- `packages/core/src/page-protocols/detail.ts`
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
  - yes, for shared detail actions
- route param changes allowed:
  - additive-only for detail entry context when required

## Verification

- slice gate:
  - targeted feature verification for each adopter changed
- generation needed:
  - none unless host manifests change
- final verifier handoff:
  - include examples for ready, refresh, invalidated, deleted, forbidden, offline, unavailable, and deep-link recovery states

## Implementation Notes

- Added shared entry evidence, recovery copy, attachment descriptors, comment descriptors, and richer action metadata to `packages/contracts/src/kernel/common-page.ts`.
- Extended `createDetailStatus` and `createDefaultDetailPageState` so detail pages can carry recovery, entry evidence, comments, and attachments without replacing `detailData`, `detailStatus`, or `detailActions`.
- Kept reader and embedded detail exceptions documented in the domain matrix instead of rewriting those surfaces.
- Updated `docs/DOMAIN_COMPLETENESS_MATRIX.md` to record the expanded detail posture.

## Verification Notes

- Ran `pnpm verify`.

## Acceptance

- [x] detail outputs remain `detailData`, `detailStatus`, and `detailActions`
- [x] no domain introduces a custom status enum when shared states apply
- [x] entry context remains explicit for list, share, and deep-link flows
- [x] documented exceptions remain narrow and justified
- [x] docs updated for protocol changes
- [x] `pnpm verify` run, or skipped with reason if docs-only
