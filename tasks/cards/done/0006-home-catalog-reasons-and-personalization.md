# D6 Home Catalog Reasons And Personalization

## Summary

Add recommendation reasons and personalization cues across home and catalog surfaces.

## Goal

Make discovery feel editorial and user-aware instead of purely structural.

## Scope

- In scope: `recommendedReason` on surfaced titles
- In scope: shared recommendation cues in catalog state
- In scope: H5 and WeChat home merchandising updates
- Out of scope: remote ranking systems

## Affected Paths

- `packages/contracts/src/api/novels.ts`
- `packages/features/catalog/src/model/index.ts`
- `packages/features/catalog/src/controller/index.ts`
- `apps/novel-h5/src/render/pages/home.ts`
- `apps/novel-h5/src/render/pages/catalog.ts`
- `packages/tooling/src/host-wechat-shells.ts`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Acceptance

- [x] change is local and reversible
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
