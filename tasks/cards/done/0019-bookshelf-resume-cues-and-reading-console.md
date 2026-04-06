# D19 Bookshelf Resume Cues And Reading Console

## Summary

Push the bookshelf from a sortable list into a clearer reading console with explicit resume cues.

## Goal

Make it obvious why a title is currently surfaced, where the reader paused, and why that title belongs at the top of the shelf.

## Scope

- In scope: shared resume cue fields in bookshelf state
- In scope: H5 shelf focus and active-lane copy
- In scope: WeChat shelf resume-cue parity
- Out of scope: custom user-authored shelf notes
- Out of scope: cross-device collaborative shelf curation

## Affected Paths

- `packages/features/bookshelf/src/model/index.ts`
- `packages/features/bookshelf/src/controller/index.ts`
- `packages/features/bookshelf/src/controller/index.test.ts`
- `apps/novel-h5/src/render/pages/bookshelf.ts`
- `packages/tooling/src/host-wechat-shells.ts`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Acceptance

- [x] change is local and reversible
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] bookshelf explains why the surfaced title is the fastest return path
- [x] H5 and WeChat share the same resume cue semantics
- [x] `pnpm gen:shells`
- [x] `pnpm verify`
