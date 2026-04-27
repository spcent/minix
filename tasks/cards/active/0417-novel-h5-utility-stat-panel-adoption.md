# Card 0417 Novel H5 Utility Stat Panel Adoption

## Summary

Adopt shared stat panels on Novel H5 utility pages.

## Goal

Replace repeated utility-page stat panel markup with `renderStatPanels` so account, discover, support, settings, and media workspace surfaces share the same renderer.

## Milestone

- milestone file: none
- slice name: `novel h5 utility stat panel adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - account page hero stats
  - feed page hero stats
  - feedback page hero stats
  - media tools page hero stats
  - settings page hero stats
  - Novel H5 host verification and typecheck
- Out of scope:
  - changing page layout
  - changing visible copy or values
  - route or manifest changes

## Ownership

- owned files:
  - `apps/novel-h5/src/render/pages/account.ts`
  - `apps/novel-h5/src/render/pages/feed.ts`
  - `apps/novel-h5/src/render/pages/feedback.ts`
  - `apps/novel-h5/src/render/pages/media-tools.ts`
  - `apps/novel-h5/src/render/pages/settings.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated manifests and registries

## Dependencies

- depends on:
  - `0403-novel-h5-stat-panel-component`
- blocked by:
  - none
- integration notes:
  - Preserve existing labels, values, and notes.

## Affected Paths

- `apps/novel-h5/src/render/pages/account.ts`
- `apps/novel-h5/src/render/pages/feed.ts`
- `apps/novel-h5/src/render/pages/feedback.ts`
- `apps/novel-h5/src/render/pages/media-tools.ts`
- `apps/novel-h5/src/render/pages/settings.ts`

## Related Specs

- `docs/modules/novel-h5.md`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - none
- controller action changes allowed:
  - none
- route param changes allowed:
  - none

## Verification

- slice gate:
  - `pnpm verify:host novel-h5`
  - `pnpm typecheck`
- generation needed:
  - none
- final verifier handoff:
  - utility page stat strips render the same content through the shared component.

## Implementation Notes

- Pending.

## Verification Notes

- Pending.

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
