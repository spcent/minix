# Card 0228 Generic Order Center Surface

## Summary

Close the remaining payment-domain surface gap by adding a routeable generic order center outside the shared membership page.

## Goal

Provide a first-class order list and order detail surface so payment and after-sales workflows are not only reachable through membership/commerce entry points.

## Milestone

- milestone file: none
- slice name: `generic order center surface`

## Priority

- priority: `P1`

## Scope

- In scope:
  - define whether the official hosts need a dedicated order-center route
  - expose shared order list and order-detail state without cloning commerce models host-locally
  - keep membership purchase flow and generic order follow-up flows coherent
- Out of scope:
  - replacing the existing membership page as the main commerce entry

## Ownership

- owned files:
  - `packages/features/subscription/src/**`
  - `apps/*/src/manifest/page-definitions.ts`
  - host render and registration files if routes are added
  - `docs/**`
- allowed generated outputs:
  - generated manifests and WeChat shells
- forbidden files:
  - host-local commerce models that fork from shared subscription state

## Dependencies

- depends on:
  - `tasks/cards/done/0215-payment-host-entry-and-provider-closure.md`
- blocked by:
  - product decision on whether order center should be generic-host only or also present on novel hosts
- integration notes:
  - reuse the shared commerce contracts and detail status semantics already present in `subscription`

## Affected Paths

- `packages/features/subscription/src/controller/index.ts`
- `packages/features/subscription/src/model/index.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`

## Interface Notes

- contract changes allowed:
  - yes, if generic order-center route state needs explicit metadata
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for order id and after-sales detail recovery

## Verification

- slice gate:
  - generic order and after-sales flows are routeable outside membership when the official host surface requires them
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells`
- final verifier handoff:
  - include order-center route decision and host exposure matrix

## Acceptance

- [ ] dedicated order-center route decision is explicit
- [ ] generic order list/detail exposure is implemented where justified
- [ ] shared commerce state remains the source of truth
- [ ] `pnpm verify` run if code changes
