# D28 Milestone History Lanes

## Summary
Extend latest milestone continuity into a short shared history lane so home, shelf, and membership can show the last few reading milestones instead of only the newest one.

## Goal
Turn milestone continuity into a progression trail that survives across storefront, reading console, and retention surfaces.

## Scope
- Persist a bounded milestone history alongside the latest milestone snapshot.
- Feed the same history into catalog, bookshelf, and subscription feature state.
- Render history lanes on H5 and WeChat home, shelf, and membership.
- Add history-item reopen actions where the source supports a return route.

## Affected Paths
- `packages/core/src/types/reading-center.ts`
- `packages/features/{catalog,bookshelf,subscription}/src/{model,controller,feature.manifest}.ts`
- `packages/features/{reader,toc,bookshelf}/src/controller/index.ts`
- `apps/novel-h5/src/render/pages/{home,bookshelf,membership}.ts`
- `packages/tooling/src/host-wechat-shells.ts`

## Acceptance
- Home, shelf, and membership show up to the last three milestones.
- History items expose source, recency, and return intent.
- Reader and TOC milestones can reopen their respective routes from history.
- Shelf milestones remain visible in history even when they are not actionable.
