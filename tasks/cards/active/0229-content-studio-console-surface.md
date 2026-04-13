# Card 0229 Content Studio Console Surface

## Summary

Track the remaining content-domain gap after discover/feed host closure: a dedicated content-studio or CMS console surface.

## Goal

Decide whether the official hosts need a routeable studio console for managed-content drafting and review instead of leaving authoring only as an embedded discover/feed sub-flow.

## Milestone

- milestone file: none
- slice name: `content studio console surface`

## Priority

- priority: `P1`

## Scope

- In scope:
  - define whether a dedicated content studio route is required for the official sample surface
  - expose content draft and review queue state through shared feature wiring if a route is justified
  - keep discover/search and content-authoring concerns distinct in host navigation and copy
- Out of scope:
  - host-local CMS implementation outside `@minix/feature-feed`

## Ownership

- owned files:
  - `packages/features/feed/src/**`
  - `apps/*/src/manifest/page-definitions.ts`
  - host render and registration files if routes are added
  - `docs/**`
- allowed generated outputs:
  - generated manifests and WeChat shells
- forbidden files:
  - standalone host-local CMS stores

## Dependencies

- depends on:
  - `tasks/cards/done/0216-content-surface-and-cms-entry-closure.md`
- blocked by:
  - product decision on whether v1 sample needs a bounded studio console
- integration notes:
  - if no studio route is added, document embedded feed authoring as intentional rather than incomplete by accident

## Affected Paths

- `packages/features/feed/src/controller/index.ts`
- `packages/features/feed/src/model/index.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Interface Notes

- contract changes allowed:
  - yes, if studio-route metadata needs to become explicit
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for content-id and review-queue recovery

## Verification

- slice gate:
  - the official-sample stance on dedicated content studio entry is explicit and implemented or documented
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells`
- final verifier handoff:
  - include content-authoring surface matrix by host

## Acceptance

- [ ] dedicated content-studio route decision is explicit
- [ ] managed-content draft/review entry is routeable where justified
- [ ] feed remains the shared source of truth for content authoring
- [ ] `pnpm verify` run if code changes
