# Card 0237 Share Provider Cutover And Attribution Validation

## Summary

Replace sample-backed share poster and short-link posture with a production-ready provider path and validate attribution end to end.

## Goal

Make share execution and attribution production-capable across direct share, link copy, poster export, and return recognition.

## Milestone

- milestone file: none
- slice name: `share provider cutover and attribution validation`

## Priority

- priority: `P0`

## Scope

- In scope:
  - integrate real short-link and poster-generation provider posture where required
  - validate channel-specific share payloads and return-attribution recognition
  - keep growth and attribution metadata explicit in host-visible share state
  - document provider-owned setup and reporting expectations
- Out of scope:
  - unrelated referral program redesign

## Ownership

- owned files:
  - `packages/contracts/src/api/share.ts`
  - `packages/features/media-tools/src/**`
  - `apps/api/src/domains/share/**`
  - `docs/**`
- allowed generated outputs:
  - generated manifests and shells only if host media-tools copy changes
- forbidden files:
  - committed short-link or poster-provider secrets

## Dependencies

- depends on:
  - `tasks/cards/done/0222-share-host-and-provider-closure.md`
  - `tasks/cards/done/0110-share-growth-provider-and-attribution-service.md`
- blocked by:
  - selected short-link and poster-generation providers
- integration notes:
  - keep share execution aligned with the existing media-tools workspace and shared attribution contract

## Affected Paths

- `packages/contracts/src/api/share.ts`
- `packages/features/media-tools/src/controller/index.ts`
- `apps/api/src/domains/share/routes.ts`
- `apps/api/src/domains/share/attribution.ts`
- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`

## Interface Notes

- contract changes allowed:
  - yes, for provider references, short-link posture, and attribution result metadata
- store shape changes allowed:
  - yes, in share payload and attribution state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - no new route is expected

## Verification

- slice gate:
  - share poster and short-link production paths no longer depend on sample-only posture
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if media-tools copy changes on WeChat
- final verifier handoff:
  - include channel matrix, provider posture, and return-attribution validation

## Acceptance

- [x] short-link and poster provider posture is production-ready where required
- [x] share payload and return-attribution loops validate against production channel behavior
- [x] host media-tools surfaces reflect production-safe share posture
- [x] docs distinguish repo-owned attribution flow from operator-owned provider setup
- [x] `pnpm verify` run if code changes
