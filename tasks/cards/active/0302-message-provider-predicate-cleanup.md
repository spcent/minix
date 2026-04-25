# Message Provider Predicate Cleanup

Status: active

## Summary

Align message touchpoint and thread provider-mode branches with shared provider posture predicates.

## Goal

Message touchpoints are reused by notifications, support, and feedback. Their sample/production posture branches should match the rest of the provider-ready domains.

## Scope

- In scope:
  - replace direct provider-mode sample/production comparisons in message touchpoints and threads where practical
  - keep message touchpoint provider config and thread delivery semantics unchanged
  - update the product-matrix reuse playbook
- Out of scope:
  - changing message contracts
  - changing delivery receipt behavior
  - changing support thread routing

## Ownership

- owned files:
  - `apps/api/src/domains/messages/touchpoints.ts`
  - `apps/api/src/domains/messages/threads.ts`
  - `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host files

## Verification

- slice gate: `pnpm verify:api`
- generation needed: no
- final verifier handoff: `pnpm verify`

## Acceptance

- [ ] message touchpoint provider-mode branches use shared predicates where practical
- [ ] message thread provider-mode branches use shared predicates where practical
- [ ] message response envelopes remain unchanged
- [ ] playbook records message provider predicate guidance
- [ ] change is local and reversible
- [ ] `pnpm verify` run, or skipped with reason if docs-only
