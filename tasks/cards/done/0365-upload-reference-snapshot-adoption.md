# Upload Reference Snapshot Adoption

Status: done

## Summary

Use API-domain snapshot helpers for upload reference context copies.

## Goal

Upload records should clone optional source and actor context consistently instead of using shallow spread copies.

## Scope

- In scope:
  - refactor upload reference cloning in `apps/api/src/domains/uploads/pipeline.ts`
  - preserve upload attach and response behavior
- Out of scope:
  - changing upload lifecycle or storage behavior
  - changing upload contracts

## Ownership

- owned files:
  - `apps/api/src/domains/uploads/pipeline.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - provider rollout docs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] upload source context snapshots use the shared optional helper
- [x] upload actor context snapshots use the shared optional helper
- [x] API tests still pass
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced shallow source and actor context copies in upload reference cloning and attach handling with `cloneOptionalDomainSnapshot`.
- Ran `pnpm verify:api`; it passed.
