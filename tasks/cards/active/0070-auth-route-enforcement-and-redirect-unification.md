# Card 0070 Auth Route Enforcement And Redirect Unification

## Summary

Replace the current page-local auth redirects with a shared route-enforcement layer that can preserve source context, enforce re-login, and normalize protected-route recovery.

## Goal

Make `redirectTarget`, unauthenticated interception, forced re-login, and return-path propagation work consistently across hosts instead of being hard-coded per controller.

## Milestone

- milestone file: none
- slice name: `route auth enforcement`

## Scope

- In scope:
  - turn `guardPolicy` and `enableRouteGuard` from passive metadata into real runtime behavior
  - normalize route param and redirect payload handling for auth-required flows, login-success return flows, and forced re-login flows
  - support unauthenticated interception, login-after-return, forced re-login, and source-page passthrough through one shared redirect contract
  - move repeated unauthorized redirect logic out of feature controllers where practical
  - update host manifests to use the normalized route/auth redirect surface
- Out of scope:
  - adding role-based enterprise authorization
  - building a global route compiler beyond current manifest-driven wiring

## Ownership

- owned files:
  - `packages/contracts/src/kernel/guard.ts`
  - `packages/core/src/ports/guard.ts`
  - `packages/core/src/runtime/app.ts`
  - `packages/core/src/runtime/router.ts`
  - `packages/core/src/runtime/manifest.ts`
  - `packages/features/auth/src/**`
  - `packages/features/items/src/**`
  - `packages/features/settings/src/**`
  - `packages/features/catalog/src/**`
  - `packages/features/novel-detail/src/**`
  - `packages/features/toc/src/**`
  - `packages/features/reader/src/**`
  - `packages/features/subscription/src/**`
  - `apps/*/src/manifest/page-definitions.ts`
  - affected runtime and controller tests
- allowed generated outputs:
  - generated manifest and shell files after source manifest updates
- forbidden files:
  - hand-edited generated `app.manifest.ts`
  - hand-edited generated `page-registry.ts`

## Dependencies

- depends on:
  - `0069-auth-identity-contract-hardening.md`
- blocked by:
  - none
- integration notes:
  - do not remove current host route ids; normalize redirect metadata on top of the existing manifest surface

## Affected Paths

- `packages/contracts/src/kernel/guard.ts`
- `packages/core/src/ports/guard.ts`
- `packages/core/src/runtime/app.ts`
- `packages/core/src/runtime/router.ts`
- `packages/core/src/runtime/manifest.ts`
- `packages/features/auth/src/controller/index.ts`
- `packages/features/items/src/controller/index.ts`
- `packages/features/settings/src/controller/index.ts`
- `packages/features/catalog/src/controller/index.ts`
- `packages/features/novel-detail/src/controller/index.ts`
- `packages/features/toc/src/controller/index.ts`
- `packages/features/reader/src/controller/index.ts`
- `packages/features/subscription/src/controller/index.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `README.md`
- `docs/ARCHITECTURE.md`
- `specs/repo.yaml`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - yes, only for guard and redirect metadata
- store shape changes allowed:
  - yes, for auth/route recovery state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for normalized redirect and re-login context

## Verification

- slice gate:
  - protected routes redirect through one normalized auth recovery path across all official hosts
- generation needed:
  - run `pnpm gen:manifests` and `pnpm gen:shells` after host manifest updates
- final verifier handoff:
  - record the new redirect payload schema and the hosts/pages that use it
  - record which feature-local redirect flows were deleted or folded into the shared layer

## Acceptance

- [x] `guardPolicy` is enforced at runtime, not just validated as metadata
- [x] unauthorized and forced re-login flows preserve return context consistently
- [x] feature controllers no longer each invent their own auth redirect shape where a shared path exists
- [x] return-path handling covers unauthenticated intercept, login-success jump, forced re-login, and source passthrough
- [x] `pnpm verify` run
