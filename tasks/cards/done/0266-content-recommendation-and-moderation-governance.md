# Card 0266 Content Recommendation And Moderation Governance

## Summary

Strengthen recommendation-lane and moderation governance inside the current discover-centered content stack.

## Goal

Make recommendation, ranking, review, and attachment posture more complete without creating a second content or editorial system.

## Milestone

- milestone file: none
- slice name: `content recommendation and moderation governance`

## Priority

- priority: `P2`

## Scope

- In scope:
  - recommendation-lane governance for editorial, ranking, premium, related, and continue-reading slots
  - richer moderation and review-queue posture for managed-content workflows
  - stronger attachment and derived-asset summaries inside the shared content vocabulary
- Out of scope:
  - a separate CMS host by default
  - host-only editorial stacks

## Ownership

- owned files:
  - `docs/ROADMAP.md`
  - `docs/BACKEND_CONTRACT.md`
  - `packages/contracts/src/api/content.ts`
  - `packages/features/feed`
  - `apps/api/src/domains/content`
- allowed generated outputs:
  - none
- forbidden files:
  - a second content model stack

## Dependencies

- depends on:
  - `tasks/cards/done/0256-content-and-discover-expansion-posture.md`
  - `tasks/cards/done/0250-content-search-and-discover-output-alignment.md`
- blocked by:
  - final release closure for the current `P0` queue
- integration notes:
  - keep discover as the canonical content surface even when moderation and recommendation posture becomes richer

## Affected Paths

- `docs/ROADMAP.md`
- `docs/BACKEND_CONTRACT.md`
- `packages/contracts/src/api/content.ts`
- `packages/features/feed`
- `apps/api/src/domains/content`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Interface Notes

- contract changes allowed:
  - yes, additive-only inside `contentCard`, `contentDetail`, and `contentAccess`
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - limited to extensions of the existing discover and content route families

## Verification

- slice gate:
  - recommendation and moderation posture improves without creating a second editorial stack
- generation needed:
  - none
- final verifier handoff:
  - include lane-governance rules, moderation posture, and attachment-summary changes

## Acceptance

- [x] recommendation-lane posture is clearer inside the shared content stack
- [x] moderation and review visibility remains inside discover-centered workflows
- [x] attachment and derived-asset summaries stay additive to the current content vocabulary
- [x] no second content or editorial stack is introduced
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added additive lane, moderation, and attachment summary fields to `packages/contracts/src/api/content.ts`.
- Updated `apps/api/src/domains/content/managed-content.ts` so discover, detail, lifecycle, and review-queue responses project recommendation-lane summaries, moderation summaries, and attachment summaries through the existing shared content envelope.
- Updated `apps/api/src/domains/content/novels.ts` so novel recommendation slots also expose normalized lane-governance summaries inside the same shared content vocabulary.
- Synced `docs/BACKEND_CONTRACT.md` and `docs/ROADMAP.md` to the current content-governance posture.

## Verification Notes

- `node --import tsx --test packages/features/feed/src/controller/index.test.ts`
- `node --import tsx --test apps/api/src/app.test.ts`
- `pnpm verify`
