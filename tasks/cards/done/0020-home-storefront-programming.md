# D20 Home Storefront Programming

## Summary

Push the novel home surface further toward a real storefront by giving it shared editorial explanations for why discovery is arranged the current way.

## Goal

Make the storefront explain its lead, serial, and ranking lanes with shared catalog-derived reasons instead of page-only copy.

## Scope

- In scope: shared storefront explanation fields in catalog state
- In scope: H5 home hero and lane copy
- In scope: WeChat home storefront-programming parity
- Out of scope: algorithmic recommendation changes
- Out of scope: new backend recommendation services

## Affected Paths

- `packages/features/catalog/src/model/index.ts`
- `packages/features/catalog/src/controller/index.ts`
- `packages/features/catalog/src/controller/index.test.ts`
- `apps/novel-h5/src/render/pages/home.ts`
- `packages/tooling/src/host-wechat-shells.ts`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Acceptance

- [x] change is local and reversible
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] home explains storefront, serial, and ranking lanes through shared state
- [x] H5 and WeChat share the same storefront-programming semantics
- [x] `pnpm gen:shells`
- [x] `pnpm verify`
