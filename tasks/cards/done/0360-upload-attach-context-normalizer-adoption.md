# Upload Attach Context Normalizer Adoption

Status: done

## Summary

Use shared API context normalizers when attaching uploaded assets.

## Goal

Upload reference attachment should preserve source and actor context with the same normalized optional-field behavior as other API domains.

## Scope

- In scope:
  - add an upload attach request normalizer to `apps/api/src/domains/uploads/schemas.ts`
  - refactor upload attach route to use schema-owned normalization
  - preserve existing attach behavior and response envelopes
- Out of scope:
  - changing upload pipeline state transitions
  - changing upload contracts

## Ownership

- owned files:
  - `apps/api/src/domains/uploads/schemas.ts`
  - `apps/api/src/domains/uploads/routes.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - provider rollout docs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] upload attach context shaping reuses shared normalizers
- [x] route code no longer repeats optional source/actor context copy logic
- [x] API tests still pass
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Added `normalizeUploadAttachRequest` in the upload schema module.
- Reused shared API source and actor context normalizers for upload references.
- Ran `pnpm verify:api`; it passed.
