# Message Context Normalizer Adoption

Status: active

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

- [ ] message schema normalization uses the shared context helper
- [ ] source and actor context output shape is unchanged
- [ ] API tests still pass
- [ ] `pnpm verify` run, or skipped with reason if docs-only
