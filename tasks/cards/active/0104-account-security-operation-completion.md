# Card 0104 Account Security Operation Completion

## Summary

Complete account security operations for phone change, WeChat unbind, cancellation, and destructive account actions.

## Goal

Turn account operation entries into risk-checked, auditable, reversible where appropriate, and user-confirmed workflows.

## Milestone

- milestone file: none
- slice name: `account security operation completion`

## Priority

- priority: `P0`

## Scope

- In scope:
  - require second-factor verification for phone change, unbind, and cancellation requests
  - add operation risk prompts, cooldowns, cancellation cooling-off, and cancellation revoke
  - add operation record, audit trail, and user notification hooks
  - enforce blocked/frozen/blacklisted account restrictions consistently
  - add tests for protected operations, cooldown, revoke, and unauthorized attempts
- Out of scope:
  - full OAuth provider management, covered by `0113`

## Ownership

- owned files:
  - `packages/contracts/src/api/user.ts`
  - `packages/contracts/src/api/auth.ts`
  - `packages/features/account/src/**`
  - `packages/features/settings/src/**`
  - `apps/api/src/app.ts`
  - `apps/api/src/store*.ts`
  - account/security tests
- allowed generated outputs:
  - none unless host account pages are added
- forbidden files:
  - generated host manifests and shells

## Dependencies

- depends on:
  - `0088-account-operations-and-relationship-actions.md`
  - `0094-settings-center-expansion.md`
  - `0097-auth-real-provider-and-credential-productionization.md`
- blocked by:
  - none
- integration notes:
  - settings should remain an entry hub; operation completion should live in account/auth-owned flows

## Affected Paths

- `packages/contracts/src/api/user.ts`
- `packages/features/account/src/controller/index.ts`
- `packages/features/settings/src/controller/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for operation audit, cooldown, revoke, and risk-confirmation results
- store shape changes allowed:
  - yes, for operation history and cancellation windows
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for account operation flow selection

## Verification

- slice gate:
  - high-risk account operations cannot complete without verification and audit records
- generation needed:
  - none unless new pages are added
- final verifier handoff:
  - document reversible versus irreversible operation behavior

## Acceptance

- [ ] phone change requires verified credential proof
- [ ] WeChat unbind requires risk confirmation and fallback credential availability
- [ ] cancellation has cooling-off and revoke support
- [ ] operation audit and notification hooks are recorded
- [ ] restricted account states block unsafe operations consistently
- [ ] `pnpm verify` run
