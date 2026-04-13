# Card 0083 Auth Identity Upgrade And Binding Workflows

## Summary

Build the post-login identity workflows that are still only modeled by contracts: guest upgrade, WeChat-phone binding, and account merge handling.

## Goal

Provide full business workflows for identity upgrade and binding outcomes so shared auth state is not the only part that understands these transitions.

## Milestone

- milestone file: none
- slice name: `auth identity upgrade workflows`

## Priority

- priority: `P0`

## Scope

- In scope:
  - implement guest-to-formal-account upgrade flow
  - implement WeChat-to-phone binding flow
  - implement account merge result handling, including conflict and target-account outcomes
  - propagate merge/bind/upgrade state through auth and account features
  - add redirect and return-path handling for post-upgrade continuation
  - model and expose upgrade failure reasons explicitly
- Out of scope:
  - external identity verification providers
  - irreversible account cleanup beyond the merge workflow contract

## Ownership

- owned files:
  - `packages/contracts/src/api/auth.ts`
  - `packages/contracts/src/api/user.ts`
  - `packages/features/auth/src/**`
  - `packages/features/account/src/**`
  - `apps/api/src/app.ts`
  - `apps/api/src/store*.ts`
  - selected host source manifests if dedicated upgrade pages are added
  - affected tests
- allowed generated outputs:
  - generated manifests and shells if host source pages change
- forbidden files:
  - handwritten generated outputs

## Dependencies

- depends on:
  - `0082-auth-login-method-productionization.md`
  - `0071-user-account-domain-foundation.md`
- blocked by:
  - none
- integration notes:
  - keep identity transitions explicit in shared state; do not bury them inside host-local page flags

## Affected Paths

- `packages/contracts/src/api/auth.ts`
- `packages/contracts/src/api/user.ts`
- `packages/features/auth/src/controller/index.ts`
- `packages/features/account/src/controller/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/store.ts`
- `apps/api/src/store.d1.ts`
- optional `apps/*/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, refine upgrade/bind/merge request and result contracts
- store shape changes allowed:
  - yes, in auth and account feature state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for post-upgrade continuation and merge conflict routing

## Verification

- slice gate:
  - guest upgrade, binding, and merge can each be exercised through sample API and shared feature flows
- generation needed:
  - run generation only if host manifest sources change
- final verifier handoff:
  - record upgrade, bind, and merge result states and what user-facing paths consume them

## Acceptance

- [x] guest upgrade has a dedicated shared workflow
- [x] WeChat binding to phone has a dedicated shared workflow
- [x] merge outcomes are explicit and routable instead of contract-only placeholders
- [x] account and auth surfaces stay consistent after identity transitions
- [x] `pnpm verify` run
