# Card 0239 User Detail And Account Surface Productization

## Summary

Track the remaining user-domain product gap after account-center host closure: dedicated user-detail posture and stronger profile/relationship surface design.

## Goal

Decide whether the official hosts need a routeable user-detail surface beyond the current shared account center and search-driven entry points.

## Milestone

- milestone file: none
- slice name: `user detail and account surface productization`

## Priority

- priority: `P2`

## Scope

- In scope:
  - define whether a dedicated user-detail route is needed on official hosts
  - identify account, profile, asset, and relationship sections that should stay embedded versus routeable
  - tighten product copy and entry posture for user-oriented flows
- Out of scope:
  - rebuilding the normalized account domain already implemented in shared code

## Ownership

- owned files:
  - `packages/features/account/src/**`
  - `apps/*/src/manifest/page-definitions.ts`
  - host render and registration files if routes are added
  - `docs/**`
- allowed generated outputs:
  - generated manifests and shells only if host account surfaces change
- forbidden files:
  - host-local account stores that fork shared state

## Dependencies

- depends on:
  - `tasks/cards/done/0212-user-host-surface-closure.md`
- blocked by:
  - product decision on whether user-detail should be a first-class route
- integration notes:
  - reuse the shared account center as the source of truth unless a routeable user-detail surface is explicitly justified

## Affected Paths

- `packages/features/account/src/controller/index.ts`
- `packages/features/account/src/model/index.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Interface Notes

- contract changes allowed:
  - yes, if user-detail metadata must become explicit
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, if a user-detail route is added

## Verification

- slice gate:
  - the official-sample stance on user-detail and stronger account surface entry is explicit and implemented or documented
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat pages change
- final verifier handoff:
  - include user-surface matrix by host

## Acceptance

- [x] dedicated user-detail route decision is explicit
- [x] profile, relation, and asset sections are organized intentionally between embedded and routeable surfaces
- [x] shared account center remains the source of truth unless a stronger route is justified
- [x] `pnpm verify` run if code changes
