# D3 Reader Display Sync And Return

## Summary

Persist reader display settings and let settings return directly into reader with a refresh signal.

## Goal

Make theme, mode, and font preferences feel durable and operational.

## Scope

- In scope: reader display storage
- In scope: settings controls for display preferences
- In scope: return-to-reader flow with live refresh cue
- Out of scope: broader reading-center controls

## Affected Paths

- `packages/features/reader/src/controller/index.ts`
- `packages/features/settings/src/controller/index.ts`
- `apps/novel-h5/src/render/pages/settings.ts`
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
