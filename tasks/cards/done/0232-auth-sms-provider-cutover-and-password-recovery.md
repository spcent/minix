# Card 0232 Auth SMS Provider Cutover And Password Recovery

## Summary

Replace sample-backed phone verification delivery with a production-ready SMS integration and close the remaining password-recovery launch gap.

## Goal

Make phone-code login, password reset, and account-security verification production-capable without relying on simulated delivery posture.

## Milestone

- milestone file: none
- slice name: `auth sms provider cutover and password recovery`

## Priority

- priority: `P0`

## Scope

- In scope:
  - integrate a real SMS provider adapter and explicit provider error mapping
  - remove sample-only delivery assumptions from production host copy
  - verify password-reset and account-security verification flows against provider-backed delivery
  - document operator-owned SMS setup, template ids, signing, and retry expectations
- Out of scope:
  - committing provider credentials or template secrets

## Ownership

- owned files:
  - `packages/contracts/src/api/auth.ts`
  - `packages/features/auth/src/**`
  - `apps/api/src/domains/auth/**`
  - `docs/**`
- allowed generated outputs:
  - none unless host auth manifests change
- forbidden files:
  - committed SMS credentials or private template ids

## Dependencies

- depends on:
  - `tasks/cards/done/0224-auth-provider-production-readiness.md`
- blocked by:
  - selected SMS provider account, template, and signing configuration
- integration notes:
  - preserve current login-page recovery posture; do not add a dedicated auth recovery route

## Affected Paths

- `packages/contracts/src/api/auth.ts`
- `packages/features/auth/src/controller/index.ts`
- `packages/features/auth/src/model/index.ts`
- `apps/api/src/domains/auth/routes.ts`
- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`

## Interface Notes

- contract changes allowed:
  - yes, for provider references, retry semantics, and delivery error mapping
- store shape changes allowed:
  - yes, in auth verification state only
- controller action changes allowed:
  - yes
- route param changes allowed:
  - no new route is expected

## Verification

- slice gate:
  - phone verification and password recovery no longer depend on simulated delivery in the production path
- generation needed:
  - none unless host auth surfaces change
- final verifier handoff:
  - include SMS provider matrix, failure semantics, and production-versus-sample behavior

## Acceptance

- [x] real SMS provider integration replaces sample-only production posture
- [x] password reset and account-security verification use provider-backed delivery
- [x] host copy distinguishes repo-owned flow from operator-owned SMS setup
- [x] provider failures map to normalized auth errors and retry guidance
- [x] `pnpm verify` run if code changes
