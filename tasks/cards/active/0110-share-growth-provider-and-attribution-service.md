# Card 0110 Share Growth Provider And Attribution Service

## Summary

Complete share growth loops with real short links, posters, return recognition, invite binding, and attribution reporting.

## Goal

Move share from prepared sample payloads to a complete growth flow across channels and landing paths.

## Milestone

- milestone file: none
- slice name: `share growth provider and attribution service`

## Priority

- priority: `P1`

## Scope

- In scope:
  - implement durable short-link creation and resolution
  - add poster image generation or provider integration for poster share scenarios
  - recognize share return from landing params and bind invite/conversion events
  - add channel-specific dispatch/degradation behavior for H5 and WeChat
  - add attribution reporting for share, click, return, and conversion counts
- Out of scope:
  - paid ad attribution integrations

## Ownership

- owned files:
  - `packages/contracts/src/api/share.ts`
  - `packages/features/media-tools/src/**`
  - `packages/platform-h5/src/adapters/capability.adapter.ts`
  - `packages/platform-wechat/src/adapters/capability.adapter.ts`
  - `apps/api/src/app.ts`
  - `apps/api/src/store*.ts`
  - share tests
- allowed generated outputs:
  - none unless pages are added
- forbidden files:
  - generated host manifests and shells

## Dependencies

- depends on:
  - `0086-share-growth-attribution-loop.md`
  - `0117-platform-capability-realization-and-degradation.md`
- blocked by:
  - short-link domain and poster generation strategy
- integration notes:
  - keep native channel calls inside platform adapters

## Affected Paths

- `packages/contracts/src/api/share.ts`
- `packages/features/media-tools/src/controller/index.ts`
- `packages/platform-h5/src/adapters/capability.adapter.ts`
- `packages/platform-wechat/src/adapters/capability.adapter.ts`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for short-link resolution, poster assets, return recognition, and attribution reports
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for share token and landing attribution params

## Verification

- slice gate:
  - share return can be recognized from an inbound landing route and attributed to a prepared share
- generation needed:
  - none unless pages are added
- final verifier handoff:
  - document channel support and degradation matrix

## Acceptance

- [ ] short links are durable and resolvable
- [ ] poster share produces an image asset or provider-backed URL
- [ ] invite binding and conversion attribution are implemented
- [ ] channel-specific share behavior is tested for H5 and WeChat
- [ ] attribution report exposes share/click/return/conversion metrics
- [ ] `pnpm verify` run
