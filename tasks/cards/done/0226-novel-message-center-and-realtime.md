# Card 0226 Novel Message Center And Realtime

## Summary

Track the remaining message-domain gaps: novel-host inbox exposure and the absence of a real-time transport beyond polling.

## Goal

Expose the shared inbox on the novel hosts and make an explicit product decision about whether message sync remains polling-only or upgrades to a real-time channel.

## Milestone

- milestone file: none
- slice name: `novel message center and realtime`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add `messages` host entry points for `novel-h5` and `novel-wechat` if the novel surface should expose inbox capability
  - document or implement the transport decision for polling versus real-time thread sync
  - keep provider and sync posture explicit in host-visible state
- Out of scope:
  - external email/SMS/push provider rollout, covered elsewhere

## Ownership

- owned files:
  - `packages/contracts/src/api/message.ts`
  - `packages/features/messages/src/**`
  - `apps/novel-h5/src/manifest/page-definitions.ts`
  - `apps/novel-wechat/src/manifest/page-definitions.ts`
  - novel host render and registration files if routes are added
  - `docs/**`
- allowed generated outputs:
  - generated manifests and WeChat shells
- forbidden files:
  - host-local message models that diverge from shared contracts

## Dependencies

- depends on:
  - `tasks/cards/done/0214-messages-host-adoption-and-sync-hardening.md`
- blocked by:
  - none
- integration notes:
  - if polling remains the chosen transport, document it as intentional rather than incidental

## Affected Paths

- `packages/contracts/src/api/message.ts`
- `packages/features/messages/src/controller/index.ts`
- `apps/api/src/domains/messages/**`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`

## Interface Notes

- contract changes allowed:
  - yes, for sync transport metadata or realtime cursors
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for message thread recovery

## Verification

- slice gate:
  - novel-host inbox exposure and sync transport posture are both explicit
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells`
- final verifier handoff:
  - include novel-host inbox decision and polling-versus-realtime decision

## Acceptance

- [x] message-center host exposure on novel hosts is decided and implemented
- [x] transport posture is explicit as polling-only
- [x] host-visible sync metadata matches the actual transport behavior
- [x] `pnpm verify` run after code changes
