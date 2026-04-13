# Card 0072 Settings Domain Normalization

## Summary

Split the current mixed settings surfaces into explicit shared settings contracts for common preferences, privacy controls, account controls, and reading/content preferences.

## Goal

Keep settings from remaining a static host page-data dump by turning it into a reusable domain with stable `preferences`, `featureToggles`, and `privacyOptions` outputs.

## Milestone

- milestone file: none
- slice name: `settings domain normalization`

## Scope

- In scope:
  - add shared settings contract types for `preferences`, `featureToggles`, and `privacyOptions`
  - cover common settings such as language, theme, font size, notification switches, and privacy switches
  - cover device settings such as cache cleanup, network strategy, autoplay, and weak-network mode
  - cover account settings such as profile change entry, phone change entry, unbind entry, and cancellation entry
  - cover reading/content preferences such as sorting, filtering, reading mode, and history switches
  - cover debug settings such as environment label, version, log switch, and experiment switch
  - expand the settings feature model/controller beyond reader-only and reading-center-only preferences
  - decide which settings persist in shared storage and which remain host-local display text
  - update host manifests so settings pages consume normalized page data and controller actions
- Out of scope:
  - remote settings sync across devices
  - full notification-center behavior
  - enterprise experimentation platform work

## Ownership

- owned files:
  - `packages/contracts/src/api/**`
  - `packages/core/src/store/settings.ts`
  - `packages/core/src/types/reading-center.ts`
  - `packages/features/settings/src/**`
  - `apps/*/src/manifest/page-definitions.ts`
  - affected host page source files
  - affected tests
- allowed generated outputs:
  - generated host manifests and WeChat shells
- forbidden files:
  - handwritten generated outputs

## Dependencies

- depends on:
  - `0071-user-account-domain-foundation.md`
- blocked by:
  - none
- integration notes:
  - preserve current reader preference behavior while widening the settings contract

## Affected Paths

- `packages/core/src/store/settings.ts`
- `packages/core/src/types/reading-center.ts`
- `packages/features/settings/src/model/index.ts`
- `packages/features/settings/src/controller/index.ts`
- `packages/features/settings/src/feature.manifest.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `README.md`
- `docs/ARCHITECTURE.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, add settings-domain response types as needed
- store shape changes allowed:
  - yes, in settings and reading-center storage only
- controller action changes allowed:
  - yes
- route param changes allowed:
  - none unless required for auth recovery reuse

## Verification

- slice gate:
  - settings page state is sourced from normalized settings contracts rather than only static page text
- generation needed:
  - run `pnpm gen:manifests` and `pnpm gen:shells` if host page definitions change
- final verifier handoff:
  - document which settings are shared contracts, local storage state, or host-only presentation copy
  - document which current static host page-data sections were replaced by normalized settings outputs

## Acceptance

- [x] settings can express common preferences, privacy options, account actions, and content/reading preferences explicitly
- [x] settings can express device, notification, privacy, account, content-preference, and debug controls explicitly
- [x] old reader preference controls still work after normalization
- [x] host settings pages consume the normalized model without direct platform calls
- [x] `pnpm verify` run
