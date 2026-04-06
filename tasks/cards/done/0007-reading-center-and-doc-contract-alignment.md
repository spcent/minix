# D7 Reading Center And Doc Contract Alignment

## Summary

Turn settings into a reading center and align novel host docs and backend contract documentation with current behavior.

## Goal

Make settings operational for readers and keep the repo narrative aligned with the actual product state.

## Scope

- In scope: reading-center controls for display, continuity, digest, and sync posture
- In scope: H5 and WeChat settings wording updates
- In scope: novel README and backend contract updates
- Out of scope: real backend delivery for reminders or sync

## Affected Paths

- `packages/features/settings/src/controller/index.ts`
- `packages/features/settings/src/feature.manifest.ts`
- `apps/novel-h5/src/render/pages/settings.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`
- `packages/tooling/src/host-wechat-shells.ts`
- `apps/novel-h5/README.md`
- `apps/novel-wechat/README.md`
- `docs/BACKEND_CONTRACT.md`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Acceptance

- [x] change is local and reversible
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
