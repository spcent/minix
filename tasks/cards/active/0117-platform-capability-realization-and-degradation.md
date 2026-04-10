# Card 0117 Platform Capability Realization And Degradation

## Summary

Replace reserved platform capability semantics with real H5 and WeChat capability implementations plus explicit fallback UI behavior.

## Goal

Make payment, upload, share, clipboard, location, and related platform capabilities executable or clearly degraded per host without leaking platform APIs into shared code.

## Milestone

- milestone file: none
- slice name: `platform capability realization and degradation`

## Priority

- priority: `P2`

## Scope

- In scope:
  - implement real H5/WeChat capability paths for payment, upload selection/upload handoff, and native share where provider configuration exists
  - expose capability unavailable/degraded reasons to feature state
  - add host-specific fallback actions and user-visible guidance
  - add adapter tests for supported, unavailable, failed, and degraded outcomes
  - ensure shared packages still do not call `window.*` or `wx.*` directly
- Out of scope:
  - provider backend completion for payment/upload/share, covered by domain cards

## Ownership

- owned files:
  - `packages/platform-h5/src/**`
  - `packages/platform-wechat/src/**`
  - `packages/core/src/**`
  - affected feature packages consuming capabilities
  - platform adapter tests
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests and shells

## Dependencies

- depends on:
  - `0100-payment-real-gateway-and-ledger-completion.md`
  - `0101-upload-object-storage-and-review-completion.md`
  - `0110-share-growth-provider-and-attribution-service.md`
- blocked by:
  - platform provider credentials and host API availability
- integration notes:
  - shared code must continue to use capability ports only

## Affected Paths

- `packages/platform-h5/src/adapters/capability.adapter.ts`
- `packages/platform-wechat/src/adapters/capability.adapter.ts`
- `packages/core/src/**`
- `packages/features/*/src/**`

## Related Specs

- `docs/ARCHITECTURE.md`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - yes, only for shared capability result/degradation metadata if needed
- store shape changes allowed:
  - yes, in affected feature state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - no

## Verification

- slice gate:
  - every reserved capability has either a real implementation or an explicit host-degradation outcome
- generation needed:
  - none
- final verifier handoff:
  - include H5/WeChat capability support matrix

## Acceptance

- [ ] H5 and WeChat adapters expose real capability execution where configured
- [ ] unavailable capabilities return actionable degradation metadata
- [ ] feature controllers surface fallback actions
- [ ] platform APIs remain isolated to platform packages or host apps
- [ ] adapter tests cover success/failure/unavailable/degraded cases
- [ ] `pnpm verify` run
