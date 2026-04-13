# Card 0225 Novel Account Center Surface

## Summary

Close the remaining user-domain host gap by exposing the shared account center on the novel hosts.

## Goal

Make `account` available on `novel-h5` and `novel-wechat` through manifest-driven host wiring instead of limiting account operations to the official generic hosts.

## Milestone

- milestone file: none
- slice name: `novel account center surface`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add `account` host entry points for `novel-h5` and `novel-wechat`
  - wire entry affordances from novel settings or other bounded novel surfaces
  - verify account operation workflows still reuse the shared account feature package
- Out of scope:
  - adding a host-local user detail model outside the shared account feature

## Ownership

- owned files:
  - `packages/features/account/src/**`
  - `packages/features/settings/src/**`
  - `apps/novel-h5/src/manifest/page-definitions.ts`
  - `apps/novel-wechat/src/manifest/page-definitions.ts`
  - novel host render and registration files if routes are added
- allowed generated outputs:
  - generated manifests and WeChat shells
- forbidden files:
  - host-local account state abstractions

## Dependencies

- depends on:
  - `tasks/cards/done/0212-user-host-surface-closure.md`
- blocked by:
  - none
- integration notes:
  - keep account workflow ownership in `@minix/feature-account`

## Affected Paths

- `packages/features/account/src/controller/index.ts`
- `packages/features/settings/src/controller/index.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-h5/src/render/**`
- `apps/novel-wechat/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/registrations/wechat/**`

## Related Specs

- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `docs/BACKEND_CONTRACT.md`

## Interface Notes

- contract changes allowed:
  - no
- store shape changes allowed:
  - yes, only if novel entry context needs bounded additions
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for bounded return-path recovery

## Verification

- slice gate:
  - all official hosts expose the shared account center intentionally
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells`
- final verifier handoff:
  - record account host entry matrix across all four hosts

## Acceptance

- [x] `novel-h5` exposes a manifest-driven account route
- [x] `novel-wechat` exposes a manifest-driven account route
- [x] account entry is reachable from a bounded novel-host affordance
- [x] shared account workflows remain platform-agnostic
- [x] `pnpm verify` run
