# Card 0227 Settings Cross Host Operation Parity

## Summary

Close the remaining settings-domain parity gap across official hosts after the first host-surface closure batch.

## Goal

Make bounded settings affordances consistent enough across generic and novel hosts that account, device, privacy, and business-policy controls do not diverge by accident.

## Milestone

- milestone file: none
- slice name: `settings cross-host operation parity`

## Priority

- priority: `P2`

## Scope

- In scope:
  - audit which settings actions are intentionally available on each official host
  - align missing bounded entry actions when a downstream shared page now exists
  - document intentional host differences instead of leaving them implicit
- Out of scope:
  - redesigning the settings feature around host-local policy models

## Ownership

- owned files:
  - `packages/features/settings/src/**`
  - `apps/*/src/manifest/page-definitions.ts`
  - `docs/**`
- allowed generated outputs:
  - generated manifests and WeChat shells
- forbidden files:
  - host-local settings state machines

## Dependencies

- depends on:
  - `tasks/cards/done/0213-settings-surface-parity.md`
  - `tasks/cards/done/0225-novel-account-center-surface.md`
  - `tasks/cards/active/0226-novel-message-center-and-realtime.md`
  - `tasks/cards/done/0230-novel-media-tools-workspace.md`
  - `tasks/cards/done/0231-novel-feedback-support-surface.md`
- blocked by:
  - final decision on which shared surfaces the novel hosts should expose
- integration notes:
  - settings should route into shared surfaces, not reimplement them

## Affected Paths

- `packages/features/settings/src/controller/index.ts`
- `packages/features/settings/src/feature.manifest.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `docs/BACKEND_CONTRACT.md`

## Interface Notes

- contract changes allowed:
  - no
- store shape changes allowed:
  - yes, only for bounded settings action metadata
- controller action changes allowed:
  - yes
- route param changes allowed:
  - no, unless route recovery needs to expand

## Verification

- slice gate:
  - settings host differences are either intentional and documented or closed through shared navigation
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells`
- final verifier handoff:
  - include settings action matrix by host

## Acceptance

- [x] settings action parity is audited across all official hosts
- [x] missing shared navigation affordances are added where justified
- [x] intentional host differences are documented explicitly
- [x] `pnpm verify` run if code changes
