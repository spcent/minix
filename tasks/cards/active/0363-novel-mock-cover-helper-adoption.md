# Novel Mock Cover Helper Adoption

Status: active

## Summary

Adopt the shared mock cover data URL helper in novel H5 and WeChat mocks.

## Goal

Novel host mock adapters should stop carrying duplicate SVG cover generator code while preserving their existing fixture titles and palettes.

## Scope

- In scope:
  - replace local cover data URL helpers in Novel H5 and Novel WeChat mock adapters
  - preserve generated cover data URL shape
- Out of scope:
  - changing fixture catalogs
  - changing real API sample asset generation

## Ownership

- owned files:
  - `apps/novel-h5/src/bootstrap/mock-api.ts`
  - `apps/novel-wechat/src/bootstrap/mock-api.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:host novel-h5` and `pnpm verify:host novel-wechat`

## Acceptance

- [ ] Novel H5 mock covers use the shared helper
- [ ] Novel WeChat mock covers use the shared helper
- [ ] generated cover behavior remains unchanged
- [ ] `pnpm verify` run, or skipped with reason if docs-only
