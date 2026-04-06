# P3-3 Test Doc Reinforcement

## Summary

Keep novel behavior easy to evolve by tightening test coverage and product-facing documentation.

## Goal

Reduce regression risk as the novel line grows past the current demo milestone.

## Scope

- In scope: regression coverage for membership return paths
- In scope: regression coverage for settings-to-reader live apply
- In scope: regression coverage for bookshelf grouping and pinning
- In scope: keep README and backend contract docs aligned when behavior changes
- Out of scope: external documentation site work

## Affected Paths

- `packages/features/**/*.test.ts`
- `apps/**/*.test.ts`
- `apps/novel-h5/README.md`
- `apps/novel-wechat/README.md`
- `docs/BACKEND_CONTRACT.md`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Acceptance

- [x] change is local and reversible
- [x] boundaries still match specs
- [x] high-risk novel flows have focused regression coverage
- [x] docs stay aligned with the actual host and contract behavior
- [x] `pnpm verify` skipped intentionally because this batch is docs-only and previous behavior changes were already verified
