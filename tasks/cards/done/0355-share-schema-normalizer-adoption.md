# Share Schema Normalizer Adoption

Status: done

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

- [x] share normalizer removes duplicated redirect and context copy logic
- [x] share prepare request shape is unchanged
- [x] API tests still pass
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Reused API schema normalizers for share source context, attribution actor context, and redirect targets.
- Kept landing target domain-specific shaping local to share.
- Ran `pnpm verify:api`; it passed.
