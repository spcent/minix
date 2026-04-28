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

- [ ] WeChat router adapter uses `createWechatCallbackResult`
- [ ] route success still updates current location
- [ ] route failure still returns `ROUTE_ERROR`
- [ ] targeted tests pass
