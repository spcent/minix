# D4 Reader Continuity And TOC Sync

## Summary

Add long-session continuity cues to reader and keep active chapter state synchronized with TOC.

## Goal

Improve chapter-to-chapter flow so reading sessions feel continuous instead of stateless.

## Scope

- In scope: session elapsed cues
- In scope: completion and continued states
- In scope: current chapter highlight persistence in TOC
- Out of scope: advanced TOC grouping

## Affected Paths

- `packages/features/reader/src/model/index.ts`
- `packages/features/reader/src/controller/index.ts`
- `packages/features/toc/src/model/index.ts`
- `packages/features/toc/src/controller/index.ts`
- `apps/novel-h5/src/render/pages/reader.ts`
- `apps/novel-h5/src/render/pages/toc.ts`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Acceptance

- [x] change is local and reversible
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
