# Card 0250 Content Search And Discover Output Alignment

## Summary

Align shared content, search, and discover outputs so the common discover lane stays contract-led across all official hosts.

## Goal

Keep content cards, detail summaries, search filters, search results, and managed-content draft posture consistent across contracts, feed or catalog features, and API search or content routes.

## Milestone

- milestone file: none
- slice name: `content search and discover output alignment`

## Priority

- priority: `P1`

## Scope

- In scope:
  - audit the shared discover lane across `content`, `feed`, and `search` contracts
  - align ranking, filter, card, and access-summary outputs where the four official hosts consume the same shared discovery behavior
  - document any intentional novel-only content exceptions such as immersive reader or bookshelf flows
  - keep managed-content draft and review posture explicit inside the discover surface instead of implying a separate CMS lane
- Out of scope:
  - adding a new studio app or a dedicated CMS host
  - changing reader into a generic detail page

## Ownership

- owned files:
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
  - `docs/BACKEND_CONTRACT.md`
  - `packages/contracts/src/api/content.ts`
  - `packages/contracts/src/api/feed.ts`
  - `packages/contracts/src/api/search.ts`
  - `packages/features/feed/src/controller/index.ts`
  - `packages/features/feed/src/model/index.ts`
  - `packages/features/catalog/src/controller/index.ts`
  - `packages/features/catalog/src/model/index.ts`
  - `apps/api/src/domains/content/feed.ts`
  - `apps/api/src/domains/content/search.ts`
  - `apps/api/src/domains/content/routes.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - unrelated host-manifest pages outside discover or catalog surfaces

## Dependencies

- depends on:
  - `tasks/cards/active/0248-shared-output-envelope-normalization-audit.md`
- blocked by:
  - none
- integration notes:
  - keep discover as the shared cross-host content-search lane; route additions should be a last resort, not the default fix for output drift

## Affected Paths

- `packages/contracts/src/api/content.ts`
- `packages/contracts/src/api/feed.ts`
- `packages/contracts/src/api/search.ts`
- `packages/features/feed/src/controller/index.ts`
- `packages/features/feed/src/model/index.ts`
- `packages/features/catalog/src/controller/index.ts`
- `packages/features/catalog/src/model/index.ts`
- `apps/api/src/domains/content/routes.ts`
- `apps/api/src/domains/content/feed.ts`
- `apps/api/src/domains/content/search.ts`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `docs/BACKEND_CONTRACT.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - yes, for content-card, search-filter, and access-summary alignment
- store shape changes allowed:
  - limited to shared discover or search state
- controller action changes allowed:
  - yes, when needed to normalize discover outputs
- route param changes allowed:
  - limited to existing discover-route search parameter alignment only

## Verification

- slice gate:
  - discover consumers across official hosts read one explicit content-search output model with documented exceptions
- generation needed:
  - none unless host source manifests change intentionally
- final verifier handoff:
  - include discover output alignment notes and any preserved novel-only exceptions

## Acceptance

- [ ] content-card and search-result outputs are aligned across shared contracts and controllers
- [ ] discover filters and route-writeback posture stay explicit
- [ ] managed-content draft or review posture remains documented inside the shared discover lane
- [ ] novel-only exceptions stay intentional and documented
- [ ] `pnpm verify:feature feed` run, or skipped with reason if docs-only
