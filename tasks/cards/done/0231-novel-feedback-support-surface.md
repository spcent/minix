# Card 0231 Novel Feedback Support Surface

## Summary

Close the remaining feedback-domain host gap by exposing feedback and support entry on the novel hosts.

## Goal

Make `feedback` intentionally reachable on `novel-h5` and `novel-wechat` so user-support and service-loop flows are not limited to the generic hosts.

## Milestone

- milestone file: none
- slice name: `novel feedback support surface`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add `feedback` host entry points for `novel-h5` and `novel-wechat`
  - wire bounded support entry from novel settings or another justified novel surface
  - preserve the shared feedback form, ticket, FAQ, and revisit workflow
- Out of scope:
  - host-local support center implementations

## Ownership

- owned files:
  - `packages/features/feedback/src/**`
  - `packages/features/settings/src/**`
  - `apps/novel-h5/src/manifest/page-definitions.ts`
  - `apps/novel-wechat/src/manifest/page-definitions.ts`
  - novel host render and registration files if routes are added
- allowed generated outputs:
  - generated manifests and WeChat shells
- forbidden files:
  - host-local ticket models

## Dependencies

- depends on:
  - `tasks/cards/done/0223-feedback-host-support-surface-closure.md`
- blocked by:
  - none
- integration notes:
  - keep feedback and support ownership in `@minix/feature-feedback`

## Affected Paths

- `packages/features/feedback/src/controller/index.ts`
- `packages/features/settings/src/controller/index.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-h5/src/render/**`
- `apps/novel-wechat/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/registrations/wechat/**`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Interface Notes

- contract changes allowed:
  - no
- store shape changes allowed:
  - yes, only for bounded novel entry context
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for support-entry recovery

## Verification

- slice gate:
  - all official hosts expose or explicitly decline feedback/support entry
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells`
- final verifier handoff:
  - include feedback/support host matrix across all four hosts

## Acceptance

- [x] `novel-h5` exposes a manifest-driven feedback route
- [x] `novel-wechat` exposes a manifest-driven feedback route
- [x] support entry remains shared-feature-driven
- [x] `pnpm verify` run if code changes
