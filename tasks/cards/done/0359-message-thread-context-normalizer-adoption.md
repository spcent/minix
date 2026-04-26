# Message Thread Context Normalizer Adoption

Status: done

## Summary

Use shared API context normalizers when creating message threads.

## Goal

Message thread creation should shape source and actor context the same way as share and feedback so future product domains can reuse the same context contract.

## Scope

- In scope:
  - add a request normalizer to `apps/api/src/domains/messages/schemas.ts`
  - refactor thread creation route to use the schema-owned normalizer
  - preserve the existing `CreateMessageThreadRequest` shape
- Out of scope:
  - changing message delivery behavior
  - changing message contracts

## Ownership

- owned files:
  - `apps/api/src/domains/messages/schemas.ts`
  - `apps/api/src/domains/messages/routes.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] message thread context shaping reuses shared normalizers
- [x] route code no longer repeats optional source/actor context copy logic
- [x] API tests still pass
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added `normalizeCreateMessageThreadRequest` in the messages schema module.
- Reused shared API source and actor context normalizers before passing the request into the message domain workflow.
- Ran `pnpm verify:api`; it passed.
