# D18 Reader Completion Summary And Recap

## Summary

Upgrade chapter completion from a plain status cue into a recap surface that helps the reader understand what just finished and what should happen next.

## Goal

Make chapter completion feel like a trustworthy reading milestone with session context, saved-state reassurance, and a clear next step.

## Scope

- In scope: shared recap fields in reader state
- In scope: H5 post-chapter recap surface
- In scope: WeChat recap parity
- Out of scope: chapter notes or annotations
- Out of scope: social sharing

## Affected Paths

- `packages/features/reader/src/model/index.ts`
- `packages/features/reader/src/controller/index.ts`
- `packages/features/reader/src/controller/index.test.ts`
- `apps/novel-h5/src/render/pages/reader.ts`
- `packages/tooling/src/host-wechat-shells.ts`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Acceptance

- [x] change is local and reversible
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] reader completion includes summary, session context, and next-step framing
- [x] H5 and WeChat share the same recap semantics
- [x] `pnpm gen:shells`
- [x] `pnpm verify`
