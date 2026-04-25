# Upload Provider Predicate Cleanup

Status: done

## Summary

Replace remaining upload API direct production checks with shared provider posture predicates.

## Scope

- In scope: upload provider posture summaries in `apps/api/src/domains/uploads/pipeline.ts`.
- Out of scope: upload contracts, storage/review behavior, asset hosting behavior.

## Ownership

- owned files: `apps/api/src/domains/uploads/pipeline.ts`, `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`, this task card
- allowed generated outputs: none

## Verification

- slice gate: `pnpm verify:api`
- final verifier handoff: `pnpm verify`

## Acceptance

- [x] upload provider mode branches use shared predicates
- [x] upload response envelopes remain unchanged
- [x] playbook records upload provider predicate guidance
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced remaining upload review direct production checks with `isProductionProviderMode`.
- Kept upload pipeline response envelopes and review behavior unchanged.
