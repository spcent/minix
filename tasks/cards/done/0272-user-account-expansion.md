# Card 0272 User Account Expansion

## Summary

Expand user profile, account summary, status, assets, and relationship workflows through the existing account workspace.

## Goal

Add user-detail projection, relation search, entitlement-history filtering, and cancellation review flow without introducing a second user package.

## Milestone

- milestone file: none
- slice name: `user account expansion`

## Priority

- priority: `P2`

## Scope

- In scope:
  - richer `userProfile`, `accountSummary`, and `userStatus` projections
  - relation search and relation list filtering
  - asset and entitlement history filters
  - cancellation review and recovery posture
- Out of scope:
  - a new top-level user package
  - host-local account wrappers
  - a separate user-detail stack outside `packages/features/account`

## Ownership

- owned files:
  - `packages/contracts/src/api/user.ts`
  - `packages/features/account`
  - `apps/api/src/domains/account`
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- allowed generated outputs:
  - regenerated manifests or shells only if host source manifests change
- forbidden files:
  - generated manifest or WeChat shell edits by hand

## Dependencies

- depends on:
  - `tasks/cards/done/0257-account-and-relationship-expansion-posture.md`
  - `tasks/cards/done/0260-account-relationship-workspace-expansion.md`
- blocked by:
  - product decision for whether user detail remains account-centered or gets a dedicated route later
- integration notes:
  - extend `/me`, account relation, and asset history outputs first

## Affected Paths

- `packages/contracts/src/api/user.ts`
- `packages/features/account`
- `apps/api/src/domains/account`
- `apps/*/src/manifest/page-definitions.ts`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `specs/dependency-rules.yaml`
- `specs/ownership.yaml`

## Interface Notes

- contract changes allowed:
  - additive-only
- store shape changes allowed:
  - additive-only in account state
- controller action changes allowed:
  - yes, within account feature ownership
- route param changes allowed:
  - none unless a manifest-owned user-detail route is explicitly approved

## Verification

- slice gate:
  - `pnpm verify:feature account`
- generation needed:
  - host generation only when manifest source changes
- final verifier handoff:
  - include examples for profile, account summary, status, assets, relations, and cancellation posture

## Acceptance

- [x] account expansion keeps `userProfile`, `accountSummary`, and `userStatus` as canonical outputs
- [x] relation and asset history behavior stays in account domain ownership
- [x] no separate user stack is introduced
- [x] official host entry points remain manifest-driven
- [x] docs updated when workflow or accepted exceptions change
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added additive `UserAccountWorkspaceSummary` to the user contract and account API responses.
- Projected profile completeness, relation search posture, asset-history filter posture, cancellation review posture, and next-best-action copy through the account domain.
- Updated account controller state to retain and render the summary while preserving compatibility with older test stubs.
- Added controller assertions for workspace summary projection and relation-list continuity.

## Verification Notes

- `pnpm verify:feature account`
