# Card 0097 Auth Real Provider And Credential Productionization

## Summary

Replace demo login validation with real credential and provider-backed login flows.

## Goal

Make phone-code, password, and OAuth login production-capable instead of sample-validated or reserved.

## Milestone

- milestone file: none
- slice name: `auth real provider and credential productionization`

## Priority

- priority: `P0`

## Scope

- In scope:
  - add SMS verification request and verification lifecycle with expiry, retry, frequency controls, and provider error mapping
  - add password account registration/login/reset primitives with hashed password storage and failed-attempt lockout
  - replace OAuth reserved behavior with provider authorization callback handling and provider-token validation
  - propagate device, risk, and abnormal-login fields through request, contract output, feature state, and API responses
  - add tests for success, expired code, wrong password, lockout, provider failure, and risk prompts
- Out of scope:
  - full social account binding management, which is covered by `0113`
  - production secret provisioning outside repository configuration

## Ownership

- owned files:
  - `packages/contracts/src/api/auth.ts`
  - `packages/features/auth/src/**`
  - `apps/api/src/app.ts`
  - `apps/api/src/store*.ts`
  - auth-related tests
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests and shells

## Dependencies

- depends on:
  - `0082-auth-login-method-productionization.md`
- blocked by:
  - selected SMS vendor and OAuth provider configuration
- integration notes:
  - keep existing sample behavior behind explicit demo configuration only, not as the default production contract path

## Affected Paths

- `packages/contracts/src/api/auth.ts`
- `packages/features/auth/src/model/index.ts`
- `packages/features/auth/src/controller/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/store.ts`
- `apps/api/src/store.d1.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`

## Interface Notes

- contract changes allowed:
  - yes, for verification request/result, credential failure reason, and provider callback semantics
- store shape changes allowed:
  - yes, for credential records, verification attempts, lockout state, and provider identities
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for provider callback and recovery targets

## Verification

- slice gate:
  - login no longer depends on static demo codes or passwords in the default API path
- generation needed:
  - none unless host login callback routes are introduced
- final verifier handoff:
  - record that local/sample SMS delivery is simulated through dynamic challenge `debugCode`, while static demo constants were removed from login validation

## Acceptance

- [x] SMS code request, verification, expiry, retry, and lockout are implemented
- [x] password storage uses hashed credentials and failed-attempt protection
- [x] OAuth callback validates provider state and token before session creation
- [x] risk and abnormal-login output reaches shared `authStatus`
- [x] tests cover provider failures and credential edge cases
- [x] `pnpm verify` run
