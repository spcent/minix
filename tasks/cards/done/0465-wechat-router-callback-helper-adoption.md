# Card 0465 WeChat Router Callback Helper Adoption

## Summary

Adopt the platform-local WeChat callback Result helper in the router adapter.

## Goal

Keep WeChat adapter callback handling consistent across request, storage, UI, and router behavior without hiding router-specific error codes or current-location updates.

## Milestone

- milestone file: none
- slice name: `wechat router callback helper adoption`

## Priority

- priority: `P1`

## Scope

- In scope:
  - replace router adapter `new Promise` callback wrappers with `createWechatCallbackResult`
  - keep unsupported runtime API failures fail-closed
  - add focused router failure coverage
- Out of scope:
  - changing router adapter interface
  - changing generated WeChat shell outputs
  - changing bridge behavior

## Ownership

- owned files:
  - `packages/platform-wechat/src/adapters/router.adapter.ts`
  - `packages/platform-wechat/src/adapters/router.adapter.test.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated WeChat shell outputs

## Dependencies

- depends on:
  - `tasks/cards/done/0464-router-url-helper-parity.md`
- blocked by:
  - none
- integration notes:
  - Keep callback helper platform-local; shared core must stay free of WeChat runtime assumptions.

## Affected Paths

- `packages/platform-wechat/src/adapters/router.adapter.ts`
- `packages/platform-wechat/src/adapters/router.adapter.test.ts`

## Related Specs

- `docs/modules/platform-wechat.md`
- `docs/architecture/layers.md`

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
  - platform-wechat router tests pass
- generation needed:
  - none
- final verifier handoff:
  - confirm router-specific `ROUTE_ERROR` mapping is preserved.

## Acceptance

- [x] WeChat router adapter uses `createWechatCallbackResult`
- [x] route success still updates current location
- [x] route failure still returns `ROUTE_ERROR`
- [x] targeted tests pass

## Implementation Notes

- Replaced WeChat router adapter callback Promise wrappers with `createWechatCallbackResult`.
- Preserved current-location updates only after successful push or replace.
- Added failure coverage for `navigateTo` returning `ROUTE_ERROR`.

## Verification Notes

- `node --import tsx --test packages/platform-wechat/src/adapters/router.adapter.test.ts packages/platform-wechat/src/adapters/callback-result.test.ts`
- `pnpm typecheck`
