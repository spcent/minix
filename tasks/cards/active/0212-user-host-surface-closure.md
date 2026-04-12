# Card 0212 User Host Surface Closure

## Summary

Promote the implemented account and user domain into a first-class official-host surface instead of an H5-only entry.

## Goal

Expose `userProfile`, `accountSummary`, `userStatus`, relationship, and asset history flows consistently across official hosts.

## Milestone

- milestone file: none
- slice name: `user host surface closure`

## Priority

- priority: `P0`

## Scope

- In scope:
  - add or align account-center entry points on official hosts that do not currently expose them
  - verify relation list, relation actions, asset history, and provider operations through those host entries
  - keep account operations rooted in shared feature state instead of host-local page logic
- Out of scope:
  - adding a separate social product line or new top-level package

## Ownership

- owned files:
  - `packages/contracts/src/api/user.ts`
  - `packages/features/account/src/**`
  - `apps/api/src/domains/account/**`
  - `apps/*/src/manifest/page-definitions.ts`
- allowed generated outputs:
  - generated manifests and WeChat shells if host source manifests change
- forbidden files:
  - handwritten edits to generated host outputs

## Dependencies

- depends on:
  - `0211-login-host-and-provider-closure.md`
- blocked by:
  - none
- integration notes:
  - account pages should remain manifest-driven and reuse the existing account feature package

## Affected Paths

- `packages/contracts/src/api/user.ts`
- `packages/features/account/src/controller/index.ts`
- `apps/api/src/domains/account/routes.ts`
- `apps/api/src/domains/account/routes.identity.ts`
- `apps/api/src/domains/account/routes.relations.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for host-entry-specific metadata if required
- store shape changes allowed:
  - yes, in account feature state only
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for account return and tab-selection semantics

## Verification

- slice gate:
  - at least `host-wechat` gains a shared account/user entry and the official host matrix is updated
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat pages change
- final verifier handoff:
  - record which hosts expose profile, asset history, and relation flows

## Acceptance

- [x] official hosts expose the shared account center intentionally
- [x] relation and asset-history flows are reachable through host entry points
- [x] host wiring remains manifest- and registry-driven
- [x] boundaries still match specs
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run

## Execution Notes

- 2026-04-12: added shared `account` route wiring to `apps/host-wechat/src/manifest/page-definitions.ts` and generated WeChat page shells
- 2026-04-12: exposed account-center navigation from shared settings and identity actions from the shared account feature manifest
- 2026-04-12: verified with `pnpm verify`
