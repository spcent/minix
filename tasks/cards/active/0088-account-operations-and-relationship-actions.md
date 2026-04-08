# Card 0088 Account Operations And Relationship Actions

## Summary

Expand the shared account domain from profile summary into real account operations and bounded relationship actions.

## Goal

Close the gap between modeled account/user state and actual user-facing operations such as binding changes, account actions, and relationship management.

## Milestone

- milestone file: none
- slice name: `account operations and relationship actions`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add account-operation flows for profile edit, phone change, unbind, and cancellation entry
  - add bounded relationship-action flows for follow/fan/friend/blacklist/remark handling where appropriate
  - align account surface with user status restrictions such as frozen/blacklisted/cancellation-pending
  - keep asset and membership summaries synchronized with the richer account actions
  - avoid creating host-local account forms that bypass shared account or form contracts
- Out of scope:
  - full social graph backend
  - real-name verification provider workflow
  - wallet or points ledger systems

## Ownership

- owned files:
  - `packages/contracts/src/api/user.ts`
  - `packages/contracts/src/api/settings.ts`
  - `packages/features/account/src/**`
  - optional `packages/features/settings/src/**`
  - `apps/api/src/app.ts`
  - `apps/api/src/data.ts`
  - selected host source manifests
  - affected tests
- allowed generated outputs:
  - generated manifests and shells if host source pages change
- forbidden files:
  - direct host-local account operations that bypass shared feature packages

## Dependencies

- depends on:
  - `0071-user-account-domain-foundation.md`
  - `0083-auth-identity-upgrade-and-binding-workflows.md`
- blocked by:
  - none
- integration notes:
  - account operations should reuse the advanced form workflow once available instead of hand-rolling form state

## Affected Paths

- `packages/contracts/src/api/user.ts`
- `packages/contracts/src/api/settings.ts`
- `packages/features/account/src/model/index.ts`
- `packages/features/account/src/controller/index.ts`
- optional `packages/features/settings/src/controller/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, refine relation-action and account-operation contracts
- store shape changes allowed:
  - yes, in account and settings feature state
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for account-operation return targets

## Verification

- slice gate:
  - at least one official host can exercise shared account operations beyond static summary rendering
- generation needed:
  - run generation only if host source manifests change
- final verifier handoff:
  - record which relation actions are sample-backed versus summary-only

## Acceptance

- [ ] account surface supports bounded real operations instead of labels only
- [ ] relationship fields have bounded actions where the shared contract already models them
- [ ] user status restrictions affect account operations coherently
- [ ] shared account flows do not regress existing account summary rendering
- [ ] `pnpm verify` run
