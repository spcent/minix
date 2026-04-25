# Card 0273 Settings Policy Expansion

## Summary

Expand settings presets, notification defaults, privacy policy, device policy, and developer locks through `SettingsResponse`.

## Goal

Keep user-visible settings, feature toggles, privacy options, and effective policy synchronized across hosts without host-only settings state.

## Milestone

- milestone file: none
- slice name: `settings policy expansion`

## Priority

- priority: `P2`

## Scope

- In scope:
  - policy presets for notification, privacy, device, and developer options
  - per-channel notification defaults and unsubscribe posture
  - environment-driven locked setting keys
  - reading/content preference expansion through existing settings contracts
- Out of scope:
  - host-only settings state
  - direct platform globals from shared settings code
  - duplicated preference models in individual features

## Ownership

- owned files:
  - `packages/contracts/src/api/settings.ts`
  - `packages/features/settings`
  - `apps/api/src/domains/settings`
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- allowed generated outputs:
  - regenerated host manifests or shells only if source manifests change
- forbidden files:
  - hand-edited generated manifests or shells

## Dependencies

- depends on:
  - `tasks/cards/done/0261-settings-policy-and-governance-expansion.md`
- blocked by:
  - product policy decisions for locked settings and provider-specific notification defaults
- integration notes:
  - `preferences`, `featureToggles`, and `privacyOptions` remain the canonical output names

## Affected Paths

- `packages/contracts/src/api/settings.ts`
- `packages/features/settings`
- `apps/api/src/domains/settings`
- `apps/*/src/manifest/page-definitions.ts`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - additive-only to `SettingsResponse`
- store shape changes allowed:
  - additive-only in settings page model
- controller action changes allowed:
  - yes, for existing settings page actions
- route param changes allowed:
  - none

## Verification

- slice gate:
  - `pnpm verify:feature settings`
- generation needed:
  - none unless host manifests change
- final verifier handoff:
  - include before and after settings response examples and host-visible policy states

## Acceptance

- [x] settings expansion flows through `SettingsResponse`
- [x] locked-setting posture is environment-aware and documented
- [x] notification and privacy options remain shared across official hosts
- [x] no feature introduces caller-local preference wrappers
- [x] docs updated for policy and workflow changes
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added `SettingsPolicySummary` as an additive settings contract output covering preset, locked setting, channel default, privacy, device, and developer posture summaries.
- Threaded `policySummary` through API settings state, `createSettingsResponse`, the shared settings page model, and the settings controller projection.
- Rendered policy summary as a first-class settings section while keeping controller fallback behavior for older settings responses.
- Covered debug and production policy states in settings controller tests.

## Verification Notes

- Ran `pnpm verify:feature settings`.
