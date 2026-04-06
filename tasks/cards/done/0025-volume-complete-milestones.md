# D25 Volume Complete Milestones

## Summary

Make reader, TOC, and shelf share a stronger milestone layer so completed volumes do not disappear behind chapter-only cues.

## Goal

Promote completed volumes into first-class reading milestones across the active reading program and backlog re-entry surfaces.

## Scope

- In scope: shared TOC volume milestone state
- In scope: shared reader volume milestone state
- In scope: shared shelf archive milestone state
- In scope: H5 and WeChat parity
- Out of scope: new backend milestone APIs
- Out of scope: chapter notes or highlight history

## Affected Paths

- `packages/features/toc/src/model/index.ts`
- `packages/features/toc/src/controller/index.ts`
- `packages/features/toc/src/controller/index.test.ts`
- `packages/features/reader/src/model/index.ts`
- `packages/features/reader/src/controller/index.ts`
- `packages/features/reader/src/controller/index.test.ts`
- `packages/features/bookshelf/src/model/index.ts`
- `packages/features/bookshelf/src/controller/index.ts`
- `packages/features/bookshelf/src/controller/index.test.ts`
- `apps/novel-h5/src/render/pages/toc.ts`
- `apps/novel-h5/src/render/pages/reader.ts`
- `apps/novel-h5/src/render/pages/bookshelf.ts`
- `packages/tooling/src/host-wechat-shells.ts`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Acceptance

- [x] change is local and reversible
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] TOC surfaces a completed-volume milestone
- [x] reader surfaces a completed-volume milestone
- [x] shelf surfaces an archive milestone that matches the same reading-program posture
- [x] `pnpm gen:shells`
- [x] `pnpm verify`
