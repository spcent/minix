# API Feedback Domain Snapshot Cleanup

Status: done

## Summary

Adopt API-local snapshot helpers in feedback support domain shaping.

## Goal

Feedback/support is a reusable service-loop capability. API response shaping should use `apps/api/src/domains/snapshot.ts` consistently instead of mixing manual shallow copies and raw `structuredClone`.

## Scope

- In scope:
  - migrate feedback category, status, ticket, FAQ, support entry, and thread-message cloning to API domain snapshot helpers
  - preserve ticket bootstrap and support loop response envelopes
  - update the product-matrix reuse playbook
- Out of scope:
  - changing feedback contracts
  - changing support workflow semantics
  - changing persistence layout

## Ownership

- owned files:
  - `apps/api/src/domains/feedback/support.ts`
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

- [x] feedback support clone helpers use API domain snapshot helpers
- [x] feedback ticket and asset snapshots use API domain snapshot helpers
- [x] feedback thread message snapshots use API domain snapshot helpers
- [x] API response envelopes remain unchanged
- [x] playbook records feedback API snapshot guidance
- [x] change is local and reversible
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced feedback support category/status/ticket clones with API-domain snapshot helpers.
- Replaced FAQ catalog, support entry, asset, and support-thread message clones with API-domain snapshot helpers.
- Kept feedback bootstrap and ticket response envelopes unchanged.
