# Card 0461 WeChat Callback Adapter Result Helper

## Summary

Consolidate repeated WeChat callback-to-`Result<T>` Promise wrappers inside platform-wechat adapters.

## Goal

Reduce adapter boilerplate and make success/failure normalization easier to reuse for future WeChat runtime capabilities.

## Milestone

- milestone file: none
- slice name: `wechat callback adapter result helper`

## Priority

- priority: `P1`

## Scope

- In scope:
  - introduce a small platform-wechat helper for wrapping callback APIs into `Result<T>` promises
  - adopt it in storage, request, and UI adapters where the call shape is already repetitive
  - keep adapter-specific error codes and messages explicit at each call site
- Out of scope:
  - changing public adapter interfaces
  - changing bridge/page shell generation
  - changing H5 platform adapters

## Ownership

- owned files:
  - `packages/platform-wechat/src/adapters/*`
  - `packages/platform-wechat/src/adapters/*.test.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated WeChat shell outputs

## Dependencies

- depends on:
  - `tasks/cards/done/0460-core-capability-payload-helper-adoption.md`
- blocked by:
  - none
- integration notes:
  - Keep the helper platform-local; shared packages must not reference `wx.*` or WeChat host globals.

## Affected Paths

- `packages/platform-wechat/src/adapters`

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
  - platform-wechat adapter tests pass
- generation needed:
  - none
- final verifier handoff:
  - note the helper boundary and confirm no generated shell files changed.

## Acceptance

- [ ] callback wrapper helper exists inside `packages/platform-wechat`
- [ ] storage, request, and UI adapters use the helper where it improves clarity
- [ ] targeted platform-wechat tests pass
