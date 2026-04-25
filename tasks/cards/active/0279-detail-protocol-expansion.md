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

## Acceptance

- [ ] detail outputs remain `detailData`, `detailStatus`, and `detailActions`
- [ ] no domain introduces a custom status enum when shared states apply
- [ ] entry context remains explicit for list, share, and deep-link flows
- [ ] documented exceptions remain narrow and justified
- [ ] docs updated for protocol changes
- [ ] `pnpm verify` run, or skipped with reason if docs-only
