# M001 Card 0032 Protected Route Controller Alignment

## Summary

Align auth, items, and settings feature controllers with the frozen `v1.0` route-guard and unauthorized-recovery semantics.

## Goal

Remove per-page drift in protected-route handling so the main flow behaves consistently on both hosts.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `protected route and controller alignment`

## Scope

- In scope:
  - update feature controllers to consume the frozen auth/request semantics
  - normalize redirect and recovery behavior across `auth`, `items`, and `settings`
  - narrow any store shape additions needed for user-visible recovery and error feedback
  - update feature tests to cover route continuation and unauthorized recovery
- Out of scope:
  - host-specific render or shell copy polish
  - platform adapter changes
  - bootstrap environment selection

## Ownership

- owned files:
  - `packages/core/src/runtime/app.ts`
  - `packages/core/src/runtime/router.ts`
  - `packages/features/auth/**`
  - `packages/features/items/**`
  - `packages/features/settings/**`
- allowed generated outputs:
  - none
- forbidden files:
  - `apps/**`
  - `packages/platform-*/**`
  - `packages/tooling/**`
  - `packages/contracts/src/api/auth.ts`

## Dependencies

- depends on:
  - `0031-M001-auth-session-contract-hardening.md`
- blocked by:
  - frozen redirect param and unauthorized handling semantics from the auth/session card
- integration notes:
  - keep public controller action names stable unless the integrator explicitly approves a manifest update

## Affected Paths

- `packages/core/src/runtime/app.ts`
- `packages/core/src/runtime/router.ts`
- `packages/features/auth/*`
- `packages/features/items/*`
- `packages/features/settings/*`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`
- `tasks/milestones/M001-v1.0-release-readiness.md`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - auth, items, and settings store changes only where required for frozen recovery semantics
- controller action changes allowed:
  - narrow internal alignment only; avoid renames unless necessary
- route param changes allowed:
  - only the frozen protected-route params from the milestone

## Verification

- slice gate:
  - `pnpm verify:feature auth`
  - `pnpm verify:feature items`
  - `pnpm verify:feature settings`
- generation needed:
  - none
- final verifier handoff:
  - document any controller action changes that require host manifest regeneration

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
