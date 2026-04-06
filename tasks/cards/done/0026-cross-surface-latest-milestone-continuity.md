# D26 Cross-Surface Latest Milestone Continuity

## Summary
Promote the latest reading milestone from active reading surfaces into shared continuity that also appears on home, detail, and membership surfaces.

## Goal
Make the most recent completed reading milestone visible beyond TOC, reader, and bookshelf so storefront and retention surfaces can speak with the same continuity language.

## Scope
- Persist the latest milestone from active reading surfaces through shared storage.
- Hydrate the same milestone into catalog, novel-detail, and subscription feature state.
- Render the milestone on H5 and WeChat home, detail, and membership surfaces.
- Add controller coverage for milestone hydration on the new consumer surfaces.

## Affected Paths
- `packages/core/src/types/reading-center.ts`
- `packages/features/catalog/src/{model,controller}/`
- `packages/features/novel-detail/src/{model,controller}/`
- `packages/features/subscription/src/{model,controller}/`
- `packages/features/toc/src/controller/`
- `packages/features/reader/src/controller/`
- `packages/features/bookshelf/src/controller/`
- `apps/novel-h5/src/render/pages/{home,novel-detail,membership}.ts`
- `packages/tooling/src/host-wechat-shells.ts`

## Acceptance
- Home, detail, and membership all show the latest milestone when one exists.
- The milestone copy is sourced from shared state, not page-local hardcoding.
- WeChat regenerated shells expose the same milestone sections.
- Catalog, detail, and subscription tests cover milestone hydration from storage.
