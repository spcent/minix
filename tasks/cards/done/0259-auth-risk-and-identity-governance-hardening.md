# Card 0259 Auth Risk And Identity Governance Hardening

## Summary

Extend the current shared auth surface with stronger device-trust, abnormal-login, recovery, and provider-capability posture without widening the auth route family.

## Goal

Make future auth and identity hardening additive to the canonical auth envelope and shared identity workflow.

## Milestone

- milestone file: none
- slice name: `auth risk and identity governance hardening`

## Priority

- priority: `P2`

## Scope

- In scope:
  - device-trust scoring and repeated-login posture
  - abnormal-login review summaries and operator follow-up hints
  - stronger account-recovery and merge-decision evidence in shared auth state
  - provider-capability matrices that keep OAuth differences explicit without changing the shared auth envelope
- Out of scope:
  - a second auth route family
  - committed provider credentials or operator secrets

## Ownership

- owned files:
  - `docs/ROADMAP.md`
  - `docs/BACKEND_CONTRACT.md`
  - `packages/contracts/src/api/auth.ts`
  - `packages/features/auth`
  - `apps/api/src/domains/auth`
- allowed generated outputs:
  - none
- forbidden files:
  - host-local auth wrappers that bypass the shared auth controller

## Dependencies

- depends on:
  - `tasks/cards/done/0253-provider-adapters-and-ops-hardening.md`
  - `tasks/cards/done/0255-shared-contract-governance-hardening.md`
- blocked by:
  - final release closure for the current `P0` queue
- integration notes:
  - extend the existing `session`, `identity`, `authStatus`, and `redirectTarget` posture additively

## Affected Paths

- `docs/ROADMAP.md`
- `docs/BACKEND_CONTRACT.md`
- `packages/contracts/src/api/auth.ts`
- `packages/features/auth`
- `apps/api/src/domains/auth`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Interface Notes

- contract changes allowed:
  - yes, additive-only inside the current auth envelope
- store shape changes allowed:
  - yes, when the shared auth controller needs clearer risk or recovery posture
- controller action changes allowed:
  - yes
- route param changes allowed:
  - no new auth route family

## Verification

- slice gate:
  - auth hardening remains inside the canonical shared auth envelope and shared identity workflow
- generation needed:
  - none
- final verifier handoff:
  - include risk-state additions, recovery posture, and provider-capability rules

## Acceptance

- [x] device-trust and abnormal-login posture are additive to the shared auth surface
- [x] recovery and merge-decision evidence stays inside the shared identity workflow
- [x] provider-specific capability differences stay documented without forking auth contracts
- [x] no host-local auth fork is introduced
- [x] `pnpm verify` run, or skipped with reason if docs-only

## Implementation Notes

- Added additive auth-envelope fields for risk scores, repeated-device posture, recovery summaries, and provider-capability metadata in `packages/contracts/src/api/auth.ts`.
- Extended `apps/api/src/domains/auth/security.ts` to emit trust-score, trust-label, review-summary, and operator-follow-up posture without widening the auth route family.
- Extended `apps/api/src/domains/auth/identity.ts` so merge-required, blocked, and completed identity workflows keep recovery and operator-action summaries inside the shared workflow payload.
- Updated `packages/features/auth/src/model/index.ts` and `packages/features/auth/src/controller/index.test.ts` so the shared auth workspace exposes provider-capability differences through normalized login-method descriptors instead of host-local logic.
- Synced `docs/BACKEND_CONTRACT.md` and `docs/ROADMAP.md` to reflect the new auth-risk and identity-governance baseline.

## Verification Notes

- `node --import tsx --test packages/features/auth/src/controller/index.test.ts`
- `node --import tsx --test apps/api/src/app.test.ts`
- `pnpm verify`
