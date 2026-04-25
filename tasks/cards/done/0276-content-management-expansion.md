# Card 0276 Content Management Expansion

## Summary

Expand content moderation, editorial lanes, attachment governance, and authoring audit history through the current content stack.

## Goal

Keep articles, courses, consultation services, tool configs, posts, events, and novel content in the discover/feed/content domain without adding a parallel content stack.

## Milestone

- milestone file: none
- slice name: `content management expansion`

## Priority

- priority: `P2`

## Scope

- In scope:
  - moderation reasons and review queue metadata
  - editorial and recommendation lane governance
  - attachment governance and derived asset summaries
  - authoring audit history and lifecycle transition evidence
- Out of scope:
  - a second content package or host-only editorial lane
  - new platform families
  - caller-local content access wrappers

## Ownership

- owned files:
  - `packages/contracts/src/api/content.ts`
  - `packages/features/feed`
  - `packages/features/catalog`
  - `packages/features/novel-detail`
  - `apps/api/src/domains/content`
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- allowed generated outputs:
  - regenerated manifests or shells only if host source manifests change
- forbidden files:
  - hand-authored generated manifests or shells

## Dependencies

- depends on:
  - `tasks/cards/done/0256-content-and-discover-expansion-posture.md`
  - `tasks/cards/done/0266-content-recommendation-and-moderation-governance.md`
- blocked by:
  - product decision for any new content model beyond current `CONTENT_MODELS`
- integration notes:
  - keep shared outputs as `contentCard`, `contentDetail`, and `contentAccess`

## Affected Paths

- `packages/contracts/src/api/content.ts`
- `packages/features/feed`
- `packages/features/catalog`
- `packages/features/novel-detail`
- `apps/api/src/domains/content`
- `apps/*/src/manifest/page-definitions.ts`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `specs/dependency-rules.yaml`
- `specs/ownership.yaml`

## Interface Notes

- contract changes allowed:
  - additive-only
- store shape changes allowed:
  - additive-only in existing content/discover state
- controller action changes allowed:
  - yes, within existing feature ownership
- route param changes allowed:
  - additive-only in existing content and feed routes

## Verification

- slice gate:
  - `pnpm verify:feature feed`
- generation needed:
  - none unless host manifests change
- final verifier handoff:
  - include content card, detail, access, review queue, draft, and lifecycle mutation examples

## Acceptance

- [x] content expansion remains discover/feed/content-centered
- [x] lifecycle and review outputs remain normalized
- [x] access control keeps public, login, member, and purchased visibility semantics
- [x] attachment governance reuses upload/content references
- [x] docs updated for lifecycle or moderation behavior changes
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added additive `ContentGovernanceSummary` output for review queue, lifecycle, attachment governance, recommendation lane, audit, and access summaries.
- Threaded governance summaries through managed content cards, details, review queue responses, draft save, and lifecycle mutation responses.
- Stored governance summary in the feed controller state after content mutations and review queue loading.
- Kept content authoring, moderation, and attachment references inside the existing discover/feed/content stack.

## Verification Notes

- Ran `pnpm verify:feature feed`.
