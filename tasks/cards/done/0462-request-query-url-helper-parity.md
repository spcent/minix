# Card 0462 Request Query URL Helper Parity

## Summary

Centralize request query-string URL composition and align H5 and WeChat request adapter behavior.

## Goal

Ensure product-matrix hosts that use the shared request client get the same `RequestOptions.query` behavior, regardless of whether the platform adapter is browser fetch or WeChat request.

## Milestone

- milestone file: none
- slice name: `request query url helper parity`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add a core runtime helper for appending defined query values to absolute and relative URLs
  - replace the H5 adapter-local helper with the shared core helper
  - make the WeChat request adapter apply `RequestOptions.query`
  - add tests for the core helper and WeChat parity
- Out of scope:
  - changing request client auth or retry behavior
  - changing response envelope mapping
  - changing API route contracts

## Ownership

- owned files:
  - `packages/core/src/runtime/request.ts`
  - `packages/core/src/runtime/request.test.ts`
  - `packages/platform-h5/src/adapters/request.adapter.ts`
  - `packages/platform-wechat/src/adapters/request.adapter.ts`
  - `packages/platform-wechat/src/adapters/request.adapter.test.ts`
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
  - Keep the helper in core runtime because it is platform-neutral request normalization.

## Affected Paths

- `packages/core/src/runtime/request.ts`
- `packages/platform-h5/src/adapters/request.adapter.ts`
- `packages/platform-wechat/src/adapters/request.adapter.ts`

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
  - core request and platform request adapter tests pass
- generation needed:
  - none
- final verifier handoff:
  - confirm WeChat request adapter now preserves query parameters consistently with H5.

## Acceptance

- [x] query URL composition is centralized in core
- [x] H5 request adapter uses the shared helper
- [x] WeChat request adapter applies `RequestOptions.query`
- [x] targeted tests pass

## Implementation Notes

- Added `appendRequestQuery` to core runtime request helpers.
- Replaced the H5 adapter-local query appender with the shared helper.
- Updated WeChat request adapter to append `RequestOptions.query` before calling the host runtime.

## Verification Notes

- `node --import tsx --test packages/core/src/runtime/request.test.ts packages/platform-h5/src/adapters/request.adapter.test.ts packages/platform-wechat/src/adapters/request.adapter.test.ts`
- `pnpm typecheck`
