# Content Runtime Snapshot Adoption

Status: active

## Summary

Use shared managed-content snapshot helpers in the content runtime.

## Goal

`managed-content.ts` should no longer own private review, audit, authoring, or whole-entry clone helpers.

## Scope

- In scope:
  - import shared content snapshot helpers
  - remove private duplicate snapshot helpers
  - preserve managed content response shapes and lifecycle transitions
- Out of scope:
  - changing route behavior
  - changing upload asset binding behavior

## Ownership

- owned files:
  - `apps/api/src/domains/content/managed-content.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [ ] runtime imports shared content snapshot helpers
- [ ] private duplicate helpers are removed
- [ ] lifecycle mutation uses the entry helper
- [ ] `pnpm verify` run, or skipped with reason if docs-only
