# D24 Volume Handoff And Re-entry Cues

## Summary

Make TOC, reader, and shelf explain volume handoff and backlog queue posture more explicitly.

## Goal

Turn the active reading program into a clearer sequence:
- current volume progress
- next volume handoff
- backlog queue re-entry

## Scope

- In scope: TOC next-volume handoff cues
- In scope: reader current-volume progress and handoff copy
- In scope: shelf backlog queue explanation
- In scope: H5 and WeChat parity
- Out of scope: backend volume progression services
- Out of scope: new contract fields for bookshelf items

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
- [x] reader volume progress is current-volume based
- [x] TOC explains next-volume handoff
- [x] shelf explains backlog queue separately from current continuation
- [x] `pnpm gen:shells`
- [x] `pnpm verify`
