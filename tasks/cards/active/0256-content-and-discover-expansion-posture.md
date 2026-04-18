# Card 0256 Content And Discover Expansion Posture

## Summary

Define the safe next expansion path for richer content and discover workflows without breaking the current shared content, search, upload, and feedback model.

## Goal

Make future content-surface growth deliberate, shared-first, and compatible with the current discover-centered architecture.

## Milestone

- milestone file: none
- slice name: `content and discover expansion posture`

## Priority

- priority: `P2`

## Scope

- In scope:
  - identify safe extensions for editorial, managed-content, recommendation, moderation, and richer asset metadata flows
  - map where future content growth should extend existing contracts rather than fork a second content stack
  - document bounded exceptions if a workflow truly cannot fit the current discover-centered model
- Out of scope:
  - launching a separate CMS host by default
  - adding unrelated product breadth outside the current sample story

## Ownership

- owned files:
  - `docs/ROADMAP.md`
  - `docs/BACKEND_CONTRACT.md`
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
  - `packages/contracts/src/api/content.ts`
  - `packages/contracts/src/api/search.ts`
  - `packages/contracts/src/api/upload.ts`
  - `packages/features/feed`
  - `apps/api/src/domains/content`
  - `apps/api/src/domains/uploads`
- allowed generated outputs:
  - none
- forbidden files:
  - a second disconnected content-model stack for one host family only

## Dependencies

- depends on:
  - `tasks/cards/active/0250-content-search-and-discover-output-alignment.md`
- blocked by:
  - final release closure for the current `P0` queue
- integration notes:
  - extend the current discover, content, upload, and feedback story instead of creating a parallel editorial runtime

## Affected Paths

- `docs/ROADMAP.md`
- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `packages/contracts/src/api/content.ts`
- `packages/contracts/src/api/search.ts`
- `packages/contracts/src/api/upload.ts`
- `packages/features/feed`
- `apps/api/src/domains/content`
- `apps/api/src/domains/uploads`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Interface Notes

- contract changes allowed:
  - yes, when extending the current content or discover envelopes additively
- store shape changes allowed:
  - yes, when richer discover or managed-content state still fits the shared controller model
- controller action changes allowed:
  - yes
- route param changes allowed:
  - limited to extensions of the existing discover and content route families

## Verification

- slice gate:
  - future content growth remains compatible with the current shared discover and content stack
- generation needed:
  - none
- final verifier handoff:
  - include the approved extension boundaries and any explicit exceptions

## Acceptance

- [x] future content growth is mapped onto the existing shared content/discover model
- [x] richer editorial or moderation flows do not implicitly create a second content stack
- [x] any true exception is documented explicitly
- [x] current normalized content and discover outputs remain the base contract
- [x] `pnpm verify` run, or skipped with reason if this remains docs-only

## Implementation Notes

- documented the future-safe content and discover boundary in `docs/BACKEND_CONTRACT.md`, keeping editorial, moderation, ranking, and richer asset metadata additive to the current `contentCard`, `contentDetail`, `contentAccess`, and `searchResults` vocabulary
- recorded the same posture in `docs/ARCHITECTURE.md` and `docs/DOMAIN_COMPLETENESS_MATRIX.md` so future work extends the current discover-centered stack instead of inventing a second content model
- kept the current repo posture explicit in `docs/ROADMAP.md`, so the roadmap now points at the documented baseline instead of an implied future rewrite

## Verification Notes

- docs-only closeout; no additional `pnpm verify` run was needed because no runtime or contract code changed for this slice
