# Card 0086 Share Growth Attribution Loop

## Summary

Move share from payload/channel modeling into a fuller growth loop with landing targets, attribution, and return-flow recognition.

## Goal

Turn share into a real reusable business capability rather than a contract wrapper around platform share calls.

## Milestone

- milestone file: none
- slice name: `share growth attribution loop`

## Priority

- priority: `P0`

## Scope

- In scope:
  - implement share target preparation for page, content, invite, and poster flows
  - add sample short-link or landing-target normalization where needed
  - persist and surface attribution fields such as channel markers, invite binding, click/conversion counters, and return-flow recognition
  - support copy-link and platform-native share paths through the shared feature surface
  - align share return handling with auth and route recovery flows
- Out of scope:
  - real poster rendering service
  - production analytics or attribution vendor integrations

## Ownership

- owned files:
  - `packages/contracts/src/api/share.ts`
  - `packages/features/media-tools/src/**`
  - optional auth/account/content feature files
  - `apps/api/src/app.ts`
  - selected host source manifests if new share-entry pages or routes are needed
  - affected tests
- allowed generated outputs:
  - generated manifests and shells if host source pages change
- forbidden files:
  - shared-code calls to platform share APIs outside capability adapters

## Dependencies

- depends on:
  - `0076-upload-share-foundation.md`
  - `0070-auth-route-enforcement-and-redirect-unification.md`
- blocked by:
  - none
- integration notes:
  - share attribution should align with auth redirect and return-path semantics rather than inventing a parallel route recovery scheme

## Affected Paths

- `packages/contracts/src/api/share.ts`
- `packages/features/media-tools/src/controller/index.ts`
- optional `packages/features/auth/src/**`
- optional `packages/features/account/src/**`
- optional `packages/features/catalog/src/**`
- `apps/api/src/app.ts`
- optional `apps/*/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`

## Interface Notes

- contract changes allowed:
  - yes, refine landing-target and attribution state
- store shape changes allowed:
  - yes, in share-consuming feature state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for share return targets and channel markers

## Verification

- slice gate:
  - at least one share flow preserves attribution through dispatch and return
- generation needed:
  - run generation only if host source manifests change
- final verifier handoff:
  - record which attribution fields are persisted and which remain placeholders

## Acceptance

- [ ] share flow supports business landing targets beyond a raw payload demo
- [ ] attribution and return-flow recognition survive through a sample end-to-end path
- [ ] invite/share source markers integrate with auth and routing recovery
- [ ] copy-link and native share paths both fit the shared contract
- [ ] `pnpm verify` run
