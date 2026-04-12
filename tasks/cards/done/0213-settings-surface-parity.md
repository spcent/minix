# Card 0213 Settings Surface Parity

## Summary

Bring the already-implemented settings domain to parity across official hosts and bounded settings operations.

## Goal

Ensure each official host exposes a coherent shared settings surface for account, device, privacy, notification, and developer policies.

## Milestone

- milestone file: none
- slice name: `settings surface parity`

## Priority

- priority: `P1`

## Scope

- In scope:
  - compare settings sections and actions across all official hosts
  - add missing shared settings affordances where a host still exposes only a reduced shell
  - verify logout, account-entry routing, policy locks, and device actions per host
- Out of scope:
  - introducing host-specific settings models outside the shared feature

## Ownership

- owned files:
  - `packages/contracts/src/api/settings.ts`
  - `packages/features/settings/src/**`
  - `apps/api/src/domains/settings/**`
  - `apps/*/src/manifest/page-definitions.ts`
- allowed generated outputs:
  - generated manifests and WeChat shells if host source manifests change
- forbidden files:
  - host-local settings logic that bypasses shared settings feature state

## Dependencies

- depends on:
  - `0212-user-host-surface-closure.md`
- blocked by:
  - none
- integration notes:
  - keep reader-specific local preferences layered on top of the normalized settings response

## Affected Paths

- `packages/contracts/src/api/settings.ts`
- `packages/features/settings/src/controller/index.ts`
- `apps/api/src/domains/settings/routes.ts`
- `apps/api/src/domains/settings/state.ts`
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
  - yes, if host-parity work needs extra settings metadata
- store shape changes allowed:
  - yes, in settings state only
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for return semantics only

## Verification

- slice gate:
  - all official hosts expose deliberate shared settings behavior rather than static copy-only shells
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat pages change
- final verifier handoff:
  - include host-by-host settings section parity matrix

## Acceptance

- [x] settings entry points remain present and consistent across official hosts
- [x] bounded account/device/privacy/debug actions are exercised through shared controllers
- [x] host wiring remains manifest- and registry-driven
- [x] boundaries still match specs
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run

## Execution Notes

- 2026-04-12: extended the shared settings controller and feature manifest with bounded navigation for `account`, `feed`, `messages`, `feedback`, and `mediaTools`
- 2026-04-12: updated `host-wechat` settings wiring so those routes are reachable from the shared settings page instead of host-local code
- 2026-04-12: verified with `pnpm verify`
