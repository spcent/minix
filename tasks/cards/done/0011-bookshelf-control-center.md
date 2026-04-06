# P2-1 Bookshelf Control Center

## Summary

Push bookshelf beyond sorting and pinning into a real reading control surface.

## Goal

Help users understand what to resume, what updated, and what has already been completed without scanning the whole shelf.

## Scope

- In scope: stronger active, updated, and completed overview cards
- In scope: pinned lane with clearer rationale
- In scope: `because you paused here` and `updated since last session` cues
- In scope: lightweight groups such as frontlist, archive, or premium
- Out of scope: collaborative shelves
- Out of scope: cloud collections

## Affected Paths

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
- [x] bookshelf surfaces explain why each primary lane is shown
- [x] pinned titles have a clear first-class presentation
- [x] grouped counts and lane labels remain shared-state driven
- [x] `pnpm gen:shells`
- [x] `pnpm verify`
