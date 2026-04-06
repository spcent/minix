# M001 Card 0035 Main Host Usability Upgrade

## Summary

Upgrade the main `host-h5` and `host-wechat` apps from demo-grade copy and feedback into usable official `v1.0` samples built on the frozen shared flow.

## Goal

Make the official host samples truthful about real state and capable of demonstrating the release-ready main flow without relying on placeholder-only copy.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `main host usability upgrade`

## Scope

- In scope:
  - align host page manifests and renders with the frozen feature/controller behavior
  - replace misleading static account or sync copy with state-backed or release-accurate content
  - ensure loading, error, unauthorized, and logout feedback are visible in both hosts
  - update H5 render logic and WeChat shells/pages for the main host flow only
- Out of scope:
  - changing shared auth semantics
  - changing platform adapters
  - broadening the main host route set

## Ownership

- owned files:
  - `apps/host-h5/src/manifest/**`
  - `apps/host-h5/src/render/**`
  - `apps/host-wechat/src/manifest/**`
  - `apps/host-wechat/src/registrations/**`
  - `apps/host-wechat/miniprogram/**`
- allowed generated outputs:
  - `apps/host-h5/src/manifest/*.ts`
  - `apps/host-wechat/src/manifest/*.ts`
  - `apps/host-wechat/src/registrations/page-registry.ts`
  - `apps/host-wechat/miniprogram/pages/**`
- forbidden files:
  - `packages/contracts/**`
  - `packages/core/**`
  - `packages/platform-*/**`
  - `apps/novel-*/**`

## Dependencies

- depends on:
  - `0032-M001-protected-route-controller-alignment.md`
- blocked by:
  - any unresolved controller action rename or route-param freeze issue
- integration notes:
  - treat `page-definitions.ts` as the source of truth and regenerate derived host outputs as needed

## Affected Paths

- `apps/host-h5/src/manifest/*`
- `apps/host-h5/src/render/*`
- `apps/host-wechat/src/manifest/*`
- `apps/host-wechat/src/registrations/*`
- `apps/host-wechat/miniprogram/*`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`
- `tasks/milestones/M001-v1.0-release-readiness.md`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - none
- controller action changes allowed:
  - none unless already frozen and approved upstream
- route param changes allowed:
  - only the frozen protected-route params from the milestone

## Verification

- slice gate:
  - `pnpm verify:host host-h5`
  - `pnpm verify:host host-wechat`
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells`
- final verifier handoff:
  - provide manual click-through notes for the main host loop on both platforms

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
