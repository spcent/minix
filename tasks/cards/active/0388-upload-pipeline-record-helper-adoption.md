# Upload Pipeline Record Helper Adoption

Status: active

## Summary

Use shared upload record helpers in the upload pipeline.

## Goal

Upload pipeline should no longer own private record clone helpers that duplicate reusable upload record projection behavior.

## Scope

- In scope:
  - replace private pipeline chunk, session, review, cleanup, reference, and stored record clone helpers
  - preserve upload pipeline response shapes
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

- [ ] pipeline imports shared record helpers
- [ ] private duplicate record clone helpers are removed
- [ ] API tests still pass
- [ ] `pnpm verify` run, or skipped with reason if docs-only
