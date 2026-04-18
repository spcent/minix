# Card 0257 Account And Relationship Expansion Posture

## Summary

Define the safe next expansion path for richer account, relationship, security, and entitlement workflows while keeping account as the canonical user workspace.

## Goal

Allow future user-surface growth without fragmenting account state into disconnected routes or host-local models.

## Milestone

- milestone file: none
- slice name: `account and relationship expansion posture`

## Priority

- priority: `P2`

## Scope

- In scope:
  - identify safe extensions for relation graphs, remark or blacklist workflows, entitlement history, security follow-up, and merge or recovery posture
  - map which future account growth should remain inside the shared account workspace
  - document explicit boundaries for when a separate user surface would truly be justified
- Out of scope:
  - introducing a dedicated user-detail route family by default
  - widening the official sample surface without preserving shared account ownership

## Ownership

- owned files:
  - `docs/ROADMAP.md`
  - `docs/BACKEND_CONTRACT.md`
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
  - `packages/contracts/src/api/user.ts`
  - `packages/features/account`
  - `apps/api/src/domains/account`
- allowed generated outputs:
  - none
- forbidden files:
  - host-specific user-summary forks that bypass the shared account controller

## Dependencies

- depends on:
  - `tasks/cards/active/0249-user-and-settings-summary-alignment.md`
- blocked by:
  - final release closure for the current `P0` queue
- integration notes:
  - keep account as the canonical user workspace unless a separate surface is explicitly justified

## Affected Paths

- `docs/ROADMAP.md`
- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `packages/contracts/src/api/user.ts`
- `packages/features/account`
- `apps/api/src/domains/account`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Interface Notes

- contract changes allowed:
  - yes, when extending `userProfile`, `accountSummary`, or `userStatus` additively
- store shape changes allowed:
  - yes, when richer account workspace state still fits the shared summary-workspace posture
- controller action changes allowed:
  - yes
- route param changes allowed:
  - avoid new route families unless the workspace model can no longer carry the flow

## Verification

- slice gate:
  - future account growth remains coherent inside the shared account workspace
- generation needed:
  - none
- final verifier handoff:
  - include the allowed extension areas and any explicit route-boundary exceptions

## Acceptance

- [ ] future user and relationship growth is mapped onto the shared account workspace first
- [ ] additive account-summary growth remains compatible with current normalized outputs
- [ ] any new user-surface boundary is justified explicitly instead of implied by drift
- [ ] no host-local account fork is introduced
- [ ] `pnpm verify` run, or skipped with reason if this remains docs-only
