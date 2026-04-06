# D1 Novel Host Baseline Flow

## Summary

Establish the standalone novel H5 and WeChat hosts with a complete shared route set.

## Goal

Move the novel line from bootstrap shells to a runnable product demo across both hosts.

## Scope

- In scope: `login`, `catalog/home`, `novelDetail`, `toc`, `reader`, `bookshelf`, `settings`, and `membership`
- In scope: host manifests, generated WeChat shells, and custom H5 renders
- Out of scope: real backend integration

## Affected Paths

- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`
- `apps/novel-h5/src/render/pages/*.ts`
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
