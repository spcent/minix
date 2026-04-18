# Card 0260 Account Relationship Workspace Expansion

## Summary

Expand the account workspace to cover richer relation, asset-history, security, and recovery posture without introducing a separate user-detail stack.

## Goal

Keep account as the canonical shared user workspace while making relationship and account-history flows more complete.

## Milestone

- milestone file: none
- slice name: `account relationship workspace expansion`

## Priority

- priority: `P2`

## Scope

- In scope:
  - relation-list workspaces for following, followers, friends, blocked users, and remarks
  - richer asset-history, entitlement timeline, and balance-change explanations
  - stronger security-center summaries for device history, rate limits, and audit prompts
  - bounded recovery and cancellation follow-up flows inside the account workspace
- Out of scope:
  - a default dedicated user-detail route family
  - host-specific account forks

## Ownership

- owned files:
  - `docs/ROADMAP.md`
  - `docs/BACKEND_CONTRACT.md`
  - `packages/contracts/src/api/user.ts`
  - `packages/features/account`
  - `apps/api/src/domains/account`
- allowed generated outputs:
  - none
- forbidden files:
  - host-local user-summary or relation wrappers

## Dependencies

- depends on:
  - `tasks/cards/done/0249-user-and-settings-summary-alignment.md`
  - `tasks/cards/done/0257-account-and-relationship-expansion-posture.md`
- blocked by:
  - final release closure for the current `P0` queue
- integration notes:
  - keep all new growth inside `userProfile`, `accountSummary`, `userStatus`, and shared account workspace state

## Affected Paths

- `docs/ROADMAP.md`
- `docs/BACKEND_CONTRACT.md`
- `packages/contracts/src/api/user.ts`
- `packages/features/account`
- `apps/api/src/domains/account`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Interface Notes

- contract changes allowed:
  - yes, additive-only on the shared user envelope
- store shape changes allowed:
  - yes, when the account workspace needs richer summary or list posture
- controller action changes allowed:
  - yes
- route param changes allowed:
  - avoid new route families unless the account workspace model can no longer carry the flow

## Verification

- slice gate:
  - richer user and relationship flows still read as one shared account workspace
- generation needed:
  - none
- final verifier handoff:
  - include workspace-state changes, relation posture, and any explicit route-boundary exception

## Acceptance

- [x] relation, asset, and security growth remains inside the shared account workspace
- [x] additive user-envelope changes stay compatible with current account outputs
- [x] recovery and cancellation follow-up do not imply a second user-detail stack
- [x] no host-local account fork is introduced
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added additive user-envelope summaries in `packages/contracts/src/api/user.ts` for asset-history posture, relation-list posture, security device summaries, and bounded recovery or cancellation follow-up.
- Extended `apps/api/src/domains/account/assets.ts`, `current-user.ts`, `operations.ts`, and `relations.ts` to emit those summaries from the existing account workspace instead of introducing a second user-detail route family.
- Updated `packages/features/account/src/controller/index.ts` so the account workspace projects the new asset, relation, security, and follow-up summaries into shared stats and sections.
- Updated `docs/BACKEND_CONTRACT.md` and `docs/ROADMAP.md` so the current account-workspace posture matches the repository implementation.

## Verification Notes

- `node --import tsx --test packages/features/account/src/controller/index.test.ts`
- `node --import tsx --test apps/api/src/app.test.ts`
- `pnpm verify`
