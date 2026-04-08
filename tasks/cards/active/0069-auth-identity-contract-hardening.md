# Card 0069 Auth Identity Contract Hardening

## Summary

Expand the auth contract from the current code-or-anonymous demo shape into a real shared identity surface that can support multiple login methods, guest upgrade, binding, and account merge workflows.

## Goal

Give the kernel one stable auth domain model for `session`, `identity`, `authStatus`, and `redirectTarget` before more business features depend on ad hoc login semantics.

## Milestone

- milestone file: none
- slice name: `auth identity foundation`

## Scope

- In scope:
  - extend `packages/contracts` auth request and response types to represent WeChat code login, phone verification login, password login, guest login, and reserved third-party login
  - normalize shared auth runtime state so `session`, `identity`, `authStatus`, and `redirectTarget` are first-class outputs instead of page-local inference
  - model guest-to-formal-account upgrade, WeChat-phone binding, and account merge outcomes explicitly
  - reserve auth security-baseline fields for device identifier, risk-control payload, frequency-control context, and abnormal-login prompts
  - introduce feature-owned auth model and controller updates for multiple login entry types and forced re-login outcomes
  - update API sample contract behavior for the expanded auth surface, even if some methods remain stubbed behind explicit `unsupported` or `reserved` branches
- Out of scope:
  - building full SMS provider, password hashing, or third-party OAuth integrations
  - adding host-specific login UIs beyond what the new shared contract requires

## Ownership

- owned files:
  - `packages/contracts/src/api/auth.ts`
  - `packages/core/src/runtime/auth.ts`
  - `packages/core/src/runtime/session.ts`
  - `packages/core/src/types/**`
  - `packages/features/auth/src/**`
  - `apps/api/src/app.ts`
  - `apps/api/src/store*.ts`
  - affected auth tests
- allowed generated outputs:
  - none
- forbidden files:
  - `apps/*/src/manifest/app.manifest.ts`
  - `apps/*/src/registrations/page-registry.ts`
  - `apps/*/miniprogram/pages/**`

## Dependencies

- depends on:
  - `0068-gap-closure-sequencing.md`
- blocked by:
  - none
- integration notes:
  - keep current WeChat code login and H5 anonymous login working while widening the contract

## Affected Paths

- `packages/contracts/src/api/auth.ts`
- `packages/core/src/runtime/auth.ts`
- `packages/core/src/runtime/session.ts`
- `packages/core/src/types/index.ts`
- `packages/features/auth/src/model/index.ts`
- `packages/features/auth/src/controller/index.ts`
- `packages/features/auth/src/feature.manifest.ts`
- `apps/api/src/app.ts`
- `apps/api/src/types.ts`
- `apps/api/src/store.ts`
- `apps/api/src/store.d1.ts`
- affected tests under `packages/**` and `apps/**`

## Related Specs

- `README.md`
- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - widen auth request and response types
  - add explicit auth status and identity-upgrade result types
- store shape changes allowed:
  - yes, inside shared session and auth feature state only
- controller action changes allowed:
  - yes, inside `@minix/feature-auth`
- route param changes allowed:
  - yes, only for normalized auth redirect metadata

## Verification

- slice gate:
  - current login flow still passes while new auth contract types compile and are covered by tests
- generation needed:
  - none
- final verifier handoff:
  - list which login methods are fully implemented and which are only reserved by contract
  - list which security-baseline fields are fully handled versus only reserved by contract

## Acceptance

- [x] auth contract can express WeChat code login, phone verification login, password login, guest login, and reserved third-party login
- [x] session state exposes explicit `identity` and `authStatus` instead of inferring everything from token presence
- [x] guest upgrade, binding, and merge outcomes have shared result types even if backend behavior is still sample-scoped
- [x] auth outputs explicitly cover `session`, `identity`, `authStatus`, and `redirectTarget`
- [x] device/risk/frequency/abnormal-login fields are not silently omitted from the shared contract
- [x] `pnpm verify` run
