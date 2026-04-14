# Card 0235 Message Touchpoint Provider Cutover And Realtime Upgrade

## Summary

Close the remaining message launch gap across external touchpoints and decide whether polling remains sufficient or a real-time channel is required.

## Goal

Make external message delivery production-capable and resolve the remaining realtime-versus-polling product decision explicitly.

## Milestone

- milestone file: none
- slice name: `message touchpoint provider cutover and realtime upgrade`

## Priority

- priority: `P0`

## Scope

- In scope:
  - wire production providers for external message touchpoints where required
  - validate normalized delivery state for subscription message, sms, email, and push abstractions
  - decide whether the official surface stays polling-only or adds a realtime transport
  - document recovery posture for delivery failure, retry, and sync lag
- Out of scope:
  - unrelated notification taxonomy changes

## Ownership

- owned files:
  - `packages/contracts/src/api/message.ts`
  - `packages/features/messages/src/**`
  - `apps/api/src/domains/messages/**`
  - `docs/**`
- allowed generated outputs:
  - generated manifests and shells only if host message surfaces change
- forbidden files:
  - committed third-party messaging credentials

## Dependencies

- depends on:
  - `tasks/cards/done/0214-messages-host-adoption-and-sync-hardening.md`
  - `tasks/cards/done/0226-novel-message-center-and-realtime.md`
- blocked by:
  - selected push/subscription/email/sms providers and realtime transport decision
- integration notes:
  - preserve inbox compatibility even if realtime is deferred and polling remains the chosen contract

## Affected Paths

- `packages/contracts/src/api/message.ts`
- `packages/features/messages/src/controller/index.ts`
- `apps/api/src/domains/messages/routes.ts`
- `apps/api/src/domains/messages/touchpoints.ts`
- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`

## Interface Notes

- contract changes allowed:
  - yes, for provider posture, realtime cursor metadata, and sync recovery semantics
- store shape changes allowed:
  - yes, in thread sync and delivery state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, if realtime cursors or thread recovery metadata require them

## Verification

- slice gate:
  - external touchpoints no longer depend on sample-only provider posture in the production path, and realtime-versus-polling stance is explicit
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if message surface copy changes on WeChat
- final verifier handoff:
  - include touchpoint provider matrix and transport decision

## Acceptance

- [x] external message touchpoints have production provider posture where required
- [x] polling-only versus realtime delivery is an explicit implemented decision
- [x] inbox and thread copy reflect real delivery and retry semantics
- [x] docs distinguish repo-owned messaging state from operator-owned provider setup
- [x] `pnpm verify` run if code changes
