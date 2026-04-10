# Card 0107 Settings Business Policy Center

## Summary

Connect settings preferences to real business policies and platform behavior.

## Goal

Make notification, privacy, device, autoplay, debug, and experiment settings durable and effective across features instead of static labels or local-only state.

## Milestone

- milestone file: none
- slice name: `settings business policy center`

## Priority

- priority: `P1`

## Scope

- In scope:
  - persist settings policy changes in backend state
  - connect notification settings to touchpoint delivery eligibility
  - connect privacy settings to profile/relation/search visibility
  - connect device settings to media autoplay, weak network, cache, and diagnostics behavior
  - expose experiment and debug toggles with environment-scoped constraints
- Out of scope:
  - account high-risk operation completion, covered by `0104`

## Ownership

- owned files:
  - `packages/contracts/src/api/settings.ts`
  - `packages/features/settings/src/**`
  - affected feature packages that consume settings
  - `apps/api/src/app.ts`
  - `apps/api/src/store*.ts`
  - settings tests
- allowed generated outputs:
  - none unless pages are added
- forbidden files:
  - generated host manifests and shells

## Dependencies

- depends on:
  - `0094-settings-center-expansion.md`
  - `0114-notification-touchpoint-provider-delivery.md`
  - `0112-security-risk-device-and-audit-baseline.md`
- blocked by:
  - policy decisions for which settings are user-controlled versus admin-controlled
- integration notes:
  - settings should publish normalized preferences; consuming features decide behavior through contracts and controller state

## Affected Paths

- `packages/contracts/src/api/settings.ts`
- `packages/features/settings/src/controller/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for effective policy, locked settings, and feature toggle metadata
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - no, unless new settings subpages are added

## Verification

- slice gate:
  - changed settings affect at least one real downstream feature behavior
- generation needed:
  - none unless new pages are added
- final verifier handoff:
  - include settings-to-feature behavior matrix

## Acceptance

- [ ] notification settings affect delivery eligibility
- [ ] privacy settings affect profile/relation/search exposure
- [ ] device settings affect media/cache/network behavior
- [ ] debug and experiment toggles respect environment constraints
- [ ] settings persistence survives session recovery
- [ ] `pnpm verify` run
