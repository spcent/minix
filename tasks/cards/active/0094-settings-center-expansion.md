# Card 0094 Settings Center Expansion

## Summary

Expand settings from a normalized reading/account center into a broader multi-domain settings surface with richer operational actions.

## Goal

Move settings closer to a complete settings center instead of a mostly read-oriented preference shell.

## Milestone

- milestone file: none
- slice name: `settings center expansion`

## Priority

- priority: `P2`

## Scope

- In scope:
  - expand shared settings behavior for device strategy, notification switches, privacy controls, and account actions
  - connect bounded operations such as cache clear, unbind entry, and cancellation entry to real shared flows where possible
  - keep debug/developer options explicit without leaking host runtime globals into shared features
  - align future content/account form flows with settings navigation and return semantics
- Out of scope:
  - production OS-level settings integrations
  - full experimentation platform

## Ownership

- owned files:
  - `packages/contracts/src/api/settings.ts`
  - `packages/features/settings/src/**`
  - optional `packages/features/account/src/**`
  - optional `apps/api/src/app.ts`
  - selected host source manifests
  - affected tests
- allowed generated outputs:
  - generated manifests and shells if host source pages change
- forbidden files:
  - host-local settings behavior that bypasses shared settings feature state

## Dependencies

- depends on:
  - `0072-settings-domain-normalization.md`
  - `0088-account-operations-and-relationship-actions.md`
- blocked by:
  - none
- integration notes:
  - preserve current reader and reading-center behaviors while broadening the settings center

## Affected Paths

- `packages/contracts/src/api/settings.ts`
- `packages/features/settings/src/model/index.ts`
- `packages/features/settings/src/controller/index.ts`
- optional `packages/features/account/src/**`
- optional `apps/api/src/app.ts`
- optional `apps/*/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, when settings operations need refinement
- store shape changes allowed:
  - yes, in settings feature state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for settings return targets and operation entries

## Verification

- slice gate:
  - settings surface can exercise broader actions than passive preference display
- generation needed:
  - run generation only if host source manifests change
- final verifier handoff:
  - record which settings operations are real versus entry labels only

## Acceptance

- [ ] settings center supports broader operational behavior than the current read-centric shell
- [ ] account/device/privacy/debug sections remain shared and explicit
- [ ] existing reader/reading-center preferences keep working
- [ ] `pnpm verify` run
