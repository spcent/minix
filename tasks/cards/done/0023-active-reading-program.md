# D23 Active Reading Program

## Summary

Tighten TOC, reader, and shelf into one clearer active-reading program with volume progression and backlog re-entry cues.

## Goal

Make volume-level progress explicit in TOC and reader, and make shelf explain how completed runs re-enter as backlog instead of competing with active momentum.

## Scope

- In scope: shared TOC volume progression cues
- In scope: shared reader active-program and backlog cues
- In scope: shared shelf backlog re-entry cues
- In scope: H5 and WeChat parity for those cues
- Out of scope: backend reading-program services
- Out of scope: cross-title reading plans or schedules

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
- [x] TOC explains active volume progression
- [x] reader explains active run and backlog re-entry state
- [x] shelf explains backlog re-entry separately from active continuation
- [x] `pnpm gen:shells`
- [x] `pnpm verify`
