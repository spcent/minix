# Card 0464 Router URL Helper Parity

## Summary

Centralize route location URL generation for H5 and WeChat router adapters.

## Goal

Remove duplicated route-params-to-query-string logic from platform adapters so future hosts and product-matrix pages reuse the same route URL rules.

## Milestone

- milestone file: none
- slice name: `router url helper parity`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add a core runtime helper that serializes `RouteLocation` path and params into a URL
  - replace H5 and WeChat adapter-local query builders with the shared helper
  - add focused core tests for route URL generation
- Out of scope:
  - changing route contracts
  - changing host page registries or generated manifests
  - changing route guard behavior

## Ownership

- owned files:
  - `packages/core/src/runtime/router.ts`
  - `packages/core/src/runtime/router.test.ts`
  - `packages/platform-h5/src/adapters/router.adapter.ts`
  - `packages/platform-wechat/src/adapters/router.adapter.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests and registries

## Dependencies

- depends on:
  - none
- blocked by:
  - none
- integration notes:
  - Keep the helper platform-neutral inside core runtime and import it through `@minix/core`.

## Affected Paths

- `packages/core/src/runtime/router.ts`
- `packages/platform-h5/src/adapters/router.adapter.ts`
- `packages/platform-wechat/src/adapters/router.adapter.ts`

## Related Specs

- `docs/modules/core.md`
- `docs/modules/platform-h5.md`
- `docs/modules/platform-wechat.md`

## Interface Notes

- contract changes allowed:
  - no
- store shape changes allowed:
  - no
- controller action changes allowed:
  - no
- route param changes allowed:
  - no

## Verification

- slice gate:
  - core router and platform router adapter tests pass
- generation needed:
  - none
- final verifier handoff:
  - confirm generated host files remain untouched.

## Acceptance

- [x] route URL generation is centralized in core
- [x] H5 router adapter uses the shared helper
- [x] WeChat router adapter uses the shared helper
- [x] targeted tests pass

## Implementation Notes

- Added `createRouteLocationUrl` to core router runtime helpers.
- Replaced H5 and WeChat adapter-local route query builders with the shared helper.
- Added focused core test coverage for route URL serialization.

## Verification Notes

- `node --import tsx --test packages/core/src/runtime/router.test.ts packages/platform-h5/src/adapters/router.adapter.test.ts packages/platform-wechat/src/adapters/router.adapter.test.ts`
- `pnpm typecheck`
