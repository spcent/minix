# Share Context Normalizer Adoption

Status: done

## Summary

Adopt the shared API context snapshot normalizer in share prepare schema normalization.

## Goal

Share payload and attribution context normalization should reuse the same helper as other domains while preserving redirect and landing target shaping.

## Scope

- In scope:
  - refactor `normalizeSharePrepareRequest`
  - preserve share prepare request shape
- Out of scope:
  - changing share attribution runtime behavior
  - changing share contracts

## Ownership

- owned files:
  - `apps/api/src/domains/share/schemas.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] share prepare normalization uses the shared context helper
- [x] share payload and attribution output shapes are unchanged
- [x] API tests still pass
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced duplicated share source and actor context normalization with `normalizeApiContextSnapshots`.
- Kept `sourceContext` under `sharePayload` and `actorContext` under `shareAttribution`.
- Verified with `pnpm verify:api`.
