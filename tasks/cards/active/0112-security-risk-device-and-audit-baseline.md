# Card 0112 Security Risk Device And Audit Baseline

## Summary

Centralize device identity, risk payloads, frequency controls, audit logs, and abnormal behavior prompts across sensitive domains.

## Goal

Provide a reusable security baseline for auth, account operations, payment, upload, share, feedback, and messaging.

## Milestone

- milestone file: none
- slice name: `security risk device and audit baseline`

## Priority

- priority: `P1`

## Scope

- In scope:
  - define shared risk/device request fields and normalized risk decisions
  - persist device trust state and security audit events
  - centralize frequency-control decisions for login, verification, payment, upload, share, and feedback
  - expose abnormal-login and suspicious-operation prompts to feature state
  - add tests for risk decision propagation and audit creation
- Out of scope:
  - vendor fraud provider integration unless selected for this slice

## Ownership

- owned files:
  - `packages/contracts/src/api/auth.ts`
  - `packages/contracts/src/api/user.ts`
  - shared security contracts under `packages/contracts/src/**` if needed
  - `packages/core/src/**`
  - affected feature packages
  - `apps/api/src/app.ts`
  - `apps/api/src/store*.ts`
  - security tests
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests and shells

## Dependencies

- depends on:
  - `0097-auth-real-provider-and-credential-productionization.md`
  - `0104-account-security-operation-completion.md`
- blocked by:
  - risk policy thresholds and trusted-device rules
- integration notes:
  - expected risk rejections should use `Result<T>` or typed API errors, not thrown exceptions

## Affected Paths

- `packages/contracts/src/api/auth.ts`
- `packages/contracts/src/api/user.ts`
- `packages/core/src/**`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`

## Interface Notes

- contract changes allowed:
  - yes, for device identity, risk decisions, audit events, and rate-limit state
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - no, unless risk recovery pages are introduced

## Verification

- slice gate:
  - sensitive operations produce consistent risk decisions and audit events
- generation needed:
  - none
- final verifier handoff:
  - include risk/audit matrix by feature

## Acceptance

- [ ] device identity is normalized and persisted
- [ ] risk decisions are shared across sensitive features
- [ ] frequency controls are centrally enforced
- [ ] security audit events are durable and queryable
- [ ] abnormal operation prompts reach feature state
- [ ] `pnpm verify` run
