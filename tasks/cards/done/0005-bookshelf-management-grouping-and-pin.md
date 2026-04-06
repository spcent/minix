# D5 Bookshelf Management Grouping And Pin

## Summary

Turn bookshelf into an actionable surface with mutations, sorting, grouping, and pinning.

## Goal

Let users manage active reading instead of only viewing saved titles.

## Scope

- In scope: add/remove bookshelf
- In scope: sorting and filtering
- In scope: grouped active, updated, and completed lanes
- In scope: pinned title controls
- Out of scope: custom user-defined collections

## Affected Paths

- `packages/contracts/src/api/bookshelf.ts`
- `packages/features/bookshelf/src/model/index.ts`
- `packages/features/bookshelf/src/controller/index.ts`
- `apps/novel-h5/src/render/pages/bookshelf.ts`
- `packages/tooling/src/host-wechat-shells.ts`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Acceptance

- [x] change is local and reversible
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
