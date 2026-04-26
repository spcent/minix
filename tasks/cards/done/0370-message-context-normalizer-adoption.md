# Message Context Normalizer Adoption

Status: done

## Summary

Adopt the shared API context snapshot normalizer in message thread schema normalization.

## Goal

Message thread creation should use the same context normalization convention as the rest of the API domains.

## Scope

- In scope:
  - refactor `normalizeCreateMessageThreadRequest`
  - preserve create-thread request shape
- Out of scope:
  - changing message thread runtime behavior
  - changing message contracts

## Ownership

- owned files:
  - `apps/api/src/domains/messages/schemas.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] message schema normalization uses the shared context helper
- [x] source and actor context output shape is unchanged
- [x] API tests still pass
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced duplicated source and actor context normalization in `normalizeCreateMessageThreadRequest`.
- Kept optional fields omitted through the shared helper spread.
- Verified with `pnpm verify:api`.
