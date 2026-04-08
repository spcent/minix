# Card 0082 Auth Login Method Productionization

## Summary

Move auth from contract-complete/sample-backed login methods into real multi-method workflows with explicit verification, abnormal-login handling, and operational safeguards.

## Goal

Turn `wechat_code`, `phone_code`, `password`, `guest`, and reserved `oauth` from widened contract coverage into fuller, testable business login flows.

## Milestone

- milestone file: none
- slice name: `auth login method productionization`

## Priority

- priority: `P0`

## Scope

- In scope:
  - implement real controller and sample-backend flows for phone verification login and password login
  - harden guest login beyond contract reservation, including anonymous-id lifecycle and auth-status transitions
  - introduce explicit unsupported/reserved handling for third-party `oauth` where the full provider flow is still absent
  - add abnormal-login prompts, frequency-control feedback, and risk-field propagation through auth feature state
  - add explicit login-method-specific validation, success/failure messaging, and recovery behavior
- Out of scope:
  - production SMS vendor integration
  - production password reset email flows
  - full third-party OAuth provider setup

## Ownership

- owned files:
  - `packages/contracts/src/api/auth.ts`
  - `packages/core/src/runtime/auth.ts`
  - `packages/features/auth/src/**`
  - `apps/api/src/app.ts`
  - `apps/api/src/store*.ts`
  - affected auth tests
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests and shells

## Dependencies

- depends on:
  - `0069-auth-identity-contract-hardening.md`
  - `0070-auth-route-enforcement-and-redirect-unification.md`
- blocked by:
  - none
- integration notes:
  - preserve current WeChat code login and H5 guest/anonymous path while upgrading the other methods

## Affected Paths

- `packages/contracts/src/api/auth.ts`
- `packages/core/src/runtime/auth.ts`
- `packages/features/auth/src/model/index.ts`
- `packages/features/auth/src/controller/index.ts`
- `packages/features/auth/src/feature.manifest.ts`
- `apps/api/src/app.ts`
- `apps/api/src/store.ts`
- `apps/api/src/store.d1.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`

## Interface Notes

- contract changes allowed:
  - yes, when login-method-specific request or failure semantics need refinement
- store shape changes allowed:
  - yes, in auth feature state and shared auth runtime state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, only for login-method-specific recovery or redirect semantics

## Verification

- slice gate:
  - every declared login method either has a working sample flow or an explicit reserved/unsupported outcome
- generation needed:
  - none
- final verifier handoff:
  - record which methods are fully executable versus still reserved
  - record which risk/frequency/abnormal-login outputs are enforced by runtime logic

## Acceptance

- [x] phone verification login has an end-to-end sample flow
- [x] password login has an end-to-end sample flow
- [x] guest login has explicit lifecycle behavior instead of only contract-level coverage
- [x] third-party oauth paths fail explicitly as reserved/unsupported rather than silently degrading
- [x] auth feature surfaces abnormal-login and frequency-control feedback explicitly
- [x] `pnpm verify` run
