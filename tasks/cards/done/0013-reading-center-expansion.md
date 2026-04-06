# P2-3 Reading Center Expansion

## Summary

Grow settings from a reading-center shell into a fuller reading operations page.

## Goal

Let users control not only display and continuity, but also reminder and session posture.

## Scope

- In scope: update reminders
- In scope: digest cadence detail
- In scope: night mode default
- In scope: resume strategy detail
- In scope: device-first vs cross-host sync posture copy and controls
- Out of scope: push notification delivery backend
- Out of scope: account management and billing

## Affected Paths

- `packages/features/settings/src/model/index.ts`
- `packages/features/settings/src/controller/index.ts`
- `apps/novel-h5/src/render/pages/settings.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`
- `packages/tooling/src/host-wechat-shells.ts`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Acceptance

- [x] change is local and reversible
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] settings clearly reads as a reading-center surface, not only a display-preferences page
- [x] newly added controls persist through shared storage-backed settings state
- [x] reader and bookshelf behaviors can consume the updated settings model
- [x] `pnpm gen:manifests`
- [x] `pnpm gen:shells`
- [x] `pnpm verify`
