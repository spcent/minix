# M001 Card 0033 Environment Bootstrap Release Wiring

## Summary

Replace accidental mock-first bootstrap behavior with explicit release-safe environment selection across official hosts and novel samples.

## Goal

Ensure `v1.0` hosts do not silently boot against mock adapters in release-like environments while preserving a clear local development path.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `environment and bootstrap release wiring`

## Scope

- In scope:
  - define explicit environment sources for host bootstraps
  - remove hardcoded release-unsafe mock defaults where required
  - keep a local mock-backed path for development and tests
  - update bootstrap tests to prove environment selection behavior
- Out of scope:
  - auth contract changes
  - host UI polish
  - generated shell copy changes unless bootstrap APIs force it

## Ownership

- owned files:
  - `apps/host-h5/src/bootstrap/**`
  - `apps/host-wechat/src/bootstrap/**`
  - `apps/novel-h5/src/bootstrap/**`
  - `apps/novel-wechat/src/bootstrap/**`
  - generated `apps/*/src/manifest/app.manifest.ts` only if bootstrap signatures change
- allowed generated outputs:
  - `apps/*/src/manifest/app.manifest.ts`
- forbidden files:
  - `packages/features/**`
  - `packages/platform-*/**`
  - `packages/tooling/**`
  - `apps/*/src/manifest/page-definitions.ts`

## Dependencies

- depends on:
  - `0030-M001-release-scope-freeze.md`
- blocked by:
  - final release rule for when mock adapters are allowed
- integration notes:
  - if bootstrap signatures change, hand off to integrator for manifest regeneration rather than editing generated files by hand

## Affected Paths

- `apps/host-h5/src/bootstrap/*`
- `apps/host-wechat/src/bootstrap/*`
- `apps/novel-h5/src/bootstrap/*`
- `apps/novel-wechat/src/bootstrap/*`
- `apps/*/src/manifest/app.manifest.ts`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`
- `tasks/milestones/M001-v1.0-release-readiness.md`

## Interface Notes

- contract changes allowed:
  - narrow host-facing environment config types only if required
- store shape changes allowed:
  - none
- controller action changes allowed:
  - none
- route param changes allowed:
  - none

## Verification

- slice gate:
  - targeted bootstrap and env tests
- generation needed:
  - `pnpm gen:manifests` if generated app manifests change
- final verifier handoff:
  - document how each official host chooses mock vs non-mock adapters

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
