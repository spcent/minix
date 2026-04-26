# Upload Reference Snapshot Adoption

Status: active

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

- [ ] upload source context snapshots use the shared optional helper
- [ ] upload actor context snapshots use the shared optional helper
- [ ] API tests still pass
- [ ] `pnpm verify` run, or skipped with reason if docs-only
