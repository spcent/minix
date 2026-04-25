# Payment Catalog Provider Predicate Cleanup

Status: active

## Summary

Replace payment catalog direct sample checks with shared provider posture predicates.

## Scope

- In scope: pending callback, pending reconciliation, and gateway provider selection.
- Out of scope: payment contracts, gateway request/response semantics.

## Ownership

- owned files: `apps/api/src/domains/payment/catalog.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`
- final verifier handoff: `pnpm verify`

## Acceptance

- [ ] payment catalog provider-mode branches use shared predicates
- [ ] payment response envelopes remain unchanged
- [ ] playbook records payment catalog predicate guidance
- [ ] `pnpm verify` run, or skipped with reason if docs-only
