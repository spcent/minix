# Upload Pipeline Selection Helper Adoption

Status: active

## Summary

Use shared upload task, error, and transfer helpers in upload pipeline response projection.

## Goal

Upload pipeline should not maintain private projection helpers that duplicate schema normalization behavior.

## Scope

- In scope:
  - replace private upload task, error, and transfer clone helpers in pipeline
  - preserve upload response shapes
- Out of scope:
  - changing provider posture logic
  - changing upload lifecycle transitions

## Ownership

- owned files:
  - `apps/api/src/domains/uploads/pipeline.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] pipeline selection projection uses shared helpers
- [ ] private duplicate helpers are removed
- [ ] API tests still pass
- [ ] `pnpm verify` run, or skipped with reason if docs-only
