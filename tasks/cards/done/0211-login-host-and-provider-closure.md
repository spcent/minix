# Card 0211 Login Host And Provider Closure

## Summary

Close the remaining gap between the implemented shared auth domain and the official host entry surfaces plus provider-grade execution.

## Goal

Make login, reauth, and identity-transition flows discoverable and consistent across official hosts while clearly separating production providers from sample behavior.

## Milestone

- milestone file: none
- slice name: `login host and provider closure`

## Priority

- priority: `P0`

## Scope

- In scope:
  - audit and align login entry points across `host-h5`, `host-wechat`, `novel-h5`, and `novel-wechat`
  - decide whether an explicit auth center, callback entry, or provider-return route is needed on official hosts
  - document which login methods are production-backed versus still sample-backed
  - close UX gaps around force-reauth, redirect restore, and identity-transition continuation
- Out of scope:
  - introducing a new auth abstraction layer outside existing feature/runtime boundaries

## Ownership

- owned files:
  - `packages/contracts/src/api/auth.ts`
  - `packages/features/auth/src/**`
  - `packages/core/src/runtime/auth.ts`
  - `apps/api/src/domains/auth/**`
  - `apps/*/src/manifest/page-definitions.ts`
- allowed generated outputs:
  - generated manifests and WeChat shells if host source manifests change
- forbidden files:
  - handwritten edits to generated host outputs

## Dependencies

- depends on:
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- blocked by:
  - provider callback and SMS/OAuth production rollout decisions
- integration notes:
  - keep redirect handling explicit in shared auth state rather than host-local helpers

## Affected Paths

- `packages/contracts/src/api/auth.ts`
- `packages/features/auth/src/controller/index.ts`
- `packages/core/src/runtime/auth.ts`
- `apps/api/src/domains/auth/routes.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `specs/repo.yaml`

## Interface Notes

- contract changes allowed:
  - yes, for callback, redirect, and provider-status semantics if needed
- store shape changes allowed:
  - yes, in auth feature and runtime auth state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for provider callback and continuation semantics

## Verification

- slice gate:
  - every official host exposes a deliberate auth entry and identity-transition continuation path
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat pages change
- final verifier handoff:
  - record host-by-host login entry matrix and provider backing status

## Acceptance

- [x] login entry points are explicit and consistent across official hosts
- [x] reauth and redirect continuation behavior is verified on each host
- [x] sample-backed versus production-backed login methods are documented explicitly
- [x] boundaries still match specs
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run

## Execution Notes

- official `host-h5` now keeps the Home auth entry explicit as the built-in guest path
- official `host-wechat` now keeps the Home auth entry explicit as the `wx.login` to `wechat_code` exchange path
- shared auth state now carries host-visible login method descriptors so H5 and WeChat shells can render provider backing without host-local copies
- phone verification and OAuth authorize responses now expose provider backing metadata and sample posture explicitly
- redirect restore and force-reauth copy is surfaced in official host login views instead of staying implicit in controller-only state
