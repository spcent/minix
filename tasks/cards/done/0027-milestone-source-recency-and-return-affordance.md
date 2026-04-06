# D27 Milestone Source, Recency, and Return Affordance

## Summary
Extend latest milestone continuity so home, detail, and membership can describe where a milestone came from, when it was saved, and which return action best reopens that context.

## Goal
Make milestone continuity actionable across storefront and retention surfaces instead of limiting it to passive copy.

## Scope
- Add shared milestone continuity presentation for source, recency, and return affordance.
- Persist chapter-aware milestone snapshots from reader and TOC.
- Hydrate the new continuity layer into catalog, novel-detail, and subscription state.
- Add latest-milestone re-entry actions on H5 and WeChat home, detail, and membership surfaces.
- Cover the new hydration and return actions in controller tests.

## Affected Paths
- `packages/core/src/types/reading-center.ts`
- `packages/features/catalog/src/{model,controller,feature.manifest}.ts`
- `packages/features/novel-detail/src/{model,controller,feature.manifest}.ts`
- `packages/features/subscription/src/{model,controller,feature.manifest}.ts`
- `packages/features/{reader,toc}/src/controller/index.ts`
- `apps/novel-h5/src/render/pages/{home,novel-detail,membership}.ts`
- `apps/novel-{h5,wechat}/src/manifest/page-definitions.ts`
- `packages/tooling/src/host-wechat-shells.ts`

## Acceptance
- Home, detail, and membership all show milestone source and recency when a milestone exists.
- Those surfaces expose a concrete return action, not only milestone text.
- Reader-sourced milestones can reopen the chapter route, TOC-sourced milestones can reopen the directory, and shelf-sourced milestones can reopen bookshelf.
- H5 and WeChat render the same continuity layer after regeneration.
