# Upload Pipeline Record Helper Adoption

Status: done

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

- [x] pipeline imports shared record helpers
- [x] private duplicate record clone helpers are removed
- [x] API tests still pass
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Completion Notes

- Replaced private upload pipeline chunk, session, review, cleanup, reference, selection, and stored record clone helpers with shared record helpers.
- Preserved existing upload response assembly and attach context behavior.
- Verified with `pnpm verify:api`.
