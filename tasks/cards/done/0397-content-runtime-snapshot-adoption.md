# Content Runtime Snapshot Adoption

Status: done

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

- [x] runtime imports shared content snapshot helpers
- [x] private duplicate helpers are removed
- [x] lifecycle mutation uses the entry helper
- [x] `pnpm verify:api` run for this code slice

## Completion Notes

- Replaced private managed-content snapshot helpers with imports from `content/snapshots`.
- Switched lifecycle mutation cloning from broad domain clone to `cloneManagedContentEntry`.
- Preserved response shaping and upload asset binding paths.
