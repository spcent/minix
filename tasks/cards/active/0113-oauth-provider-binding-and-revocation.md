# Card 0113 OAuth Provider Binding And Revocation

## Summary

Complete third-party provider login, binding, unbinding, conflict handling, and authorization revocation.

## Goal

Make OAuth provider accounts first-class identities that can be used for login, linked to existing users, safely unlinked, and revoked.

## Milestone

- milestone file: none
- slice name: `oauth provider binding and revocation`

## Priority

- priority: `P2`

## Scope

- In scope:
  - add provider configuration and provider identity records
  - implement provider binding, unbinding, conflict detection, and merge guidance
  - support authorization revocation and provider unlink audit records
  - expose provider state in account summary and settings/account entry surfaces
  - add tests for provider login, bind, conflict, revoke, and unlink safety
- Out of scope:
  - phone/password credential productionization, covered by `0097`

## Ownership

- owned files:
  - `packages/contracts/src/api/auth.ts`
  - `packages/contracts/src/api/user.ts`
  - `packages/features/auth/src/**`
  - `packages/features/account/src/**`
  - `apps/api/src/app.ts`
  - `apps/api/src/store*.ts`
  - OAuth tests
- allowed generated outputs:
  - none unless callback pages are added
- forbidden files:
  - generated host manifests and shells

## Dependencies

- depends on:
  - `0097-auth-real-provider-and-credential-productionization.md`
  - `0098-auth-identity-upgrade-page-flow-completion.md`
- blocked by:
  - provider list and callback domain configuration
- integration notes:
  - provider unlink must not leave the account without any usable login method

## Affected Paths

- `packages/contracts/src/api/auth.ts`
- `packages/contracts/src/api/user.ts`
- `packages/features/auth/src/controller/index.ts`
- `packages/features/account/src/controller/index.ts`
- `apps/api/src/app.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`

## Interface Notes

- contract changes allowed:
  - yes, for provider identities, authorization state, and revocation results
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for OAuth callback and provider-operation flows

## Verification

- slice gate:
  - provider identities can login, bind, unbind, and revoke safely
- generation needed:
  - none unless pages are added
- final verifier handoff:
  - record supported provider matrix

## Acceptance

- [x] OAuth provider identities are persisted
- [x] provider binding and unbinding are implemented
- [x] conflicts route into identity merge guidance
- [x] revocation records are auditable
- [x] unlink safety prevents account lockout
- [x] `pnpm verify` run
