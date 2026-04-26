# Upload Context Normalizer Adoption

Status: done

## Summary

Adopt the shared API context snapshot normalizer in upload attach schema normalization.

## Goal

Upload reference normalization should share the same context handling path used by other domains.

## Scope

- In scope:
  - refactor `normalizeUploadAttachRequest`
  - preserve upload reference request shape
- Out of scope:
  - changing upload pipeline state
  - changing upload contracts

## Ownership

- owned files:
  - `apps/api/src/domains/uploads/schemas.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] upload attach normalization uses the shared context helper
- [x] upload reference output shape is unchanged
- [x] API tests still pass
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced duplicated upload reference context normalization in `normalizeUploadAttachRequest`.
- Preserved reference owner, role, and optional context output shape.
- Verified with `pnpm verify:api`.
