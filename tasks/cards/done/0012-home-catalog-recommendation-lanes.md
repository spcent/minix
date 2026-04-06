# P2-2 Home Catalog Recommendation Lanes

## Summary

Expand recommendation reasons into more product-like home and catalog programming.

## Goal

Make every major card lane answer “why am I seeing this now?”

## Scope

- In scope: `Recently updated on your shelf`
- In scope: `Because you read...`
- In scope: membership-aware merchandising lane
- In scope: stronger frontlist editorial explanations
- Out of scope: ML ranking
- Out of scope: remote experimentation infrastructure

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
- [x] home and catalog expose multiple recommendation lanes with distinct reasons
- [x] reasons are shared-data driven, not page-only copy
- [x] H5 and WeChat stay aligned on surfaced lane meaning
- [x] `pnpm gen:shells`
- [x] `pnpm verify`
