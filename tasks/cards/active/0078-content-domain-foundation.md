# Card 0078 Content Domain Foundation

## Summary

Expand the current novel-only content surface into a reusable shared content domain that can express multiple content models, access rules, and lifecycle states.

## Goal

Create stable shared outputs for `contentCard`, `contentDetail`, and `contentAccess` so future products can reuse one content contract instead of treating the novel sample as the only content model.

## Milestone

- milestone file: none
- slice name: `content domain foundation`

## Scope

- In scope:
  - add contracts for content models such as article, course, consultation service, tool configuration, post, and event
  - add shared content status semantics for draft, published, offline, under review, and review rejected
  - add shared display semantics for tags, categories,专题, recommendation slots, pinned state, and featured state
  - add shared access semantics for public, login-required, member-only, and purchased-only visibility
  - add shared lifecycle semantics for publish, update, archive, delete, and restore
  - decide which current novel detail/list contracts remain domain-specific extensions on top of the generic content contract
  - adopt the new content contract in at least one sample surface without breaking the novel flow
- Out of scope:
  - CMS back office implementation
  - moderation workflow UI beyond status modeling
  - replacing the novel sample with a universal rendering system

## Ownership

- owned files:
  - `packages/contracts/src/api/**`
  - `packages/features/catalog/src/**`
  - `packages/features/novel-detail/src/**`
  - optional new content-focused feature package under `packages/features/*`
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - selected host source manifests
  - affected tests
- allowed generated outputs:
  - generated manifests and shells if host source manifests change
- forbidden files:
  - direct edits to generated host outputs

## Dependencies

- depends on:
  - `0071-user-account-domain-foundation.md`
  - `0073-search-and-feed-surface-foundation.md`
- blocked by:
  - none
- integration notes:
  - keep novel-specific reading fields as an explicit extension layer instead of forcing every content type to look like a chaptered novel

## Affected Paths

- `packages/contracts/src/api/novels.ts`
- `packages/contracts/src/api/novel-detail.ts`
- selected new or updated contract files under `packages/contracts/src/api/**`
- `packages/features/catalog/src/model/index.ts`
- `packages/features/catalog/src/controller/index.ts`
- `packages/features/novel-detail/src/model/index.ts`
- `packages/features/novel-detail/src/controller/index.ts`
- optional new content feature package
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- selected host `page-definitions.ts`

## Related Specs

- `README.md`
- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, add generic content contracts and refine novel-specific contracts around them
- store shape changes allowed:
  - yes, in catalog/detail/content-related feature state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, only where generic content entry needs normalized ids or source hints

## Verification

- slice gate:
  - at least one official sample surface compiles and runs against the new generic content contract without losing current novel behavior
- generation needed:
  - run generation only if host source manifests change
- final verifier handoff:
  - document the generic content layer versus novel-specific extension layer

## Acceptance

- [ ] content contracts cover model, status, display, access, and lifecycle semantics explicitly
- [ ] current novel sample remains a domain-specific extension, not the only content abstraction
- [ ] outputs include explicit `contentCard`, `contentDetail`, and `contentAccess` semantics
- [ ] `pnpm verify` run

