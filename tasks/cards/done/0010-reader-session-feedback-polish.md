# P1-3 Reader Session Feedback Polish

## Summary

Make reader progress persistence and chapter completion feedback more explicit to the user.

## Goal

Turn reader continuity from “it works” into “it feels reliable”.

## Scope

- In scope: explicit `saved just now` or `last saved` UI
- In scope: stronger completed-chapter summary before or while continuing
- In scope: clearer distinction between reading, completed, and continued states
- Out of scope: analytics backend
- Out of scope: social reading features

## Affected Paths

- `packages/features/reader/src/model/index.ts`
- `packages/features/reader/src/controller/index.ts`
- `apps/novel-h5/src/render/pages/reader.ts`
- `packages/tooling/src/host-wechat-shells.ts`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Acceptance

- [x] change is local and reversible
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] reader clearly exposes session state and save recency
- [x] chapter completion feedback survives chapter hops cleanly
- [x] H5 and WeChat both expose the same reading-state semantics
- [x] `pnpm gen:shells`
- [x] `pnpm verify`
