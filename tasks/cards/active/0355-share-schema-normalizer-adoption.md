# Share Schema Normalizer Adoption

Status: active

## Summary

Use shared API schema normalizers inside share request shaping.

## Goal

Share growth request normalization should stay readable and portable as landing, return, actor, and redirect fragments grow.

## Scope

- In scope:
  - refactor `apps/api/src/domains/share/schemas.ts` to reuse schema helper normalizers
  - preserve the existing `SharePrepareRequest` output shape
  - keep share constants and schemas unchanged
- Out of scope:
  - changing share attribution behavior
  - changing share contracts

## Ownership

- owned files:
  - `apps/api/src/domains/share/schemas.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - provider rollout docs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] share normalizer removes duplicated redirect and context copy logic
- [ ] share prepare request shape is unchanged
- [ ] API tests still pass
- [ ] `pnpm verify` run, or skipped with reason if docs-only
