# P3-2 Reader TOC Structural Polish

## Summary

Polish deep reading behavior so long sessions feel quieter and more stable.

## Goal

Reduce friction during extended reading sessions and chapter navigation.

## Scope

- In scope: TOC volume folding or grouping
- In scope: stronger active chapter jump-back
- In scope: cleaner session transition wording
- In scope: smoother reader panel hierarchy
- Out of scope: virtualization or large-scale performance work unless required

## Affected Paths

- `packages/features/reader/src/controller/index.ts`
- `packages/features/toc/src/controller/index.ts`
- `apps/novel-h5/src/render/components/reader-panels.ts`
- `apps/novel-h5/src/render/pages/toc.ts`
- `apps/novel-h5/src/render/pages/reader.ts`
- `packages/tooling/src/host-wechat-shells.ts`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Acceptance

- [x] change is local and reversible
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] TOC and reader stay visually and semantically in sync over long sessions
- [x] current chapter recovery feels immediate and obvious
- [x] `pnpm gen:shells`
- [x] `pnpm verify`
