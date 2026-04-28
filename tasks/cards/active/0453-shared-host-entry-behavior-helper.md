# Card 0453 Shared Host Entry Behavior Helper

## Summary

Extract repeated H5/Wechat feature entry-action maps into a typed shared host behavior helper.

## Goal

Reduce manifest duplication and keep cross-host entry action parity explicit so feature packages can be reused across product hosts with fewer host-local edits.

## Milestone

- milestone file: none
- slice name: `shared host entry behavior helper`

## Scope

- In scope:
  - add a typed helper in `@minix/core` for common H5/Wechat entry actions with host-specific additions
  - adopt the helper in representative feature manifests with identical or near-identical host action maps
  - add core tests for shared behavior merge and controller method typing
- Out of scope:
  - route, controller, or public contract changes
  - generated host manifest edits
  - broad rewrite of every feature manifest in one slice

## Ownership

- owned files:
  - `packages/core/src/runtime/manifest.ts`
  - `packages/core/src/runtime/manifest.test.ts`
  - `packages/features/*/src/feature.manifest.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests and registries

## Dependencies

- depends on:
  - none
- blocked by:
  - none
- integration notes:
  - Keep the helper host-agnostic and typed against controller method names.

## Affected Paths

- `packages/core/src/runtime/manifest.ts`
- `packages/features/*/src/feature.manifest.ts`

## Related Specs

- `specs/dependency-rules.yaml`
- `specs/repo.yaml`
- `docs/AGENT_GUIDE.md`

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
  - `pnpm typecheck`
  - `node --import tsx --test packages/core/src/runtime/manifest.test.ts packages/features/**/*.test.ts`
- generation needed:
  - none
- final verifier handoff:
  - Feature manifests should express shared entry actions once and host additions separately.

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
