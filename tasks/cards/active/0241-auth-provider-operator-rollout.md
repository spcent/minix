# Card 0241 Auth Provider Operator Rollout

## Summary

Execute the remaining operator-owned auth launch work for SMS and OAuth after the shared production posture closed in code.

## Goal

Provision real SMS and OAuth providers, register callback domains, and capture release evidence for login, recovery, and identity flows.

## Milestone

- milestone file: none
- slice name: `auth provider operator rollout`

## Priority

- priority: `P0`

## Scope

- In scope:
  - provision real SMS and OAuth provider credentials outside tracked source
  - register OAuth callback domains against the deployed API target
  - configure production env values for `MINIX_AUTH_SMS_PROVIDER_MODE` and `MINIX_AUTH_OAUTH_PROVIDER_MODE`
  - validate login, refresh, logout, recovery, and bind flows against real providers
  - capture rollout evidence in release logs
- Out of scope:
  - new auth contracts or route changes

## Ownership

- owned files:
  - `docs/PRODUCTION_READINESS.md`
  - `docs/RELEASE_RUNBOOK.md`
  - `docs/VERIFICATION_LOG.md`
- allowed generated outputs:
  - none
- forbidden files:
  - committed provider credentials, secrets, or callback private ids

## Dependencies

- depends on:
  - `tasks/cards/done/0232-auth-sms-provider-cutover-and-password-recovery.md`
  - `tasks/cards/done/0233-auth-oauth-provider-cutover-and-callback-registration.md`
- blocked by:
  - selected production SMS and OAuth providers
- integration notes:
  - keep provider execution operator-owned; repo code already fails closed when production mode is unconfigured

## Affected Paths

- `docs/PRODUCTION_READINESS.md`
- `docs/RELEASE_RUNBOOK.md`
- `docs/VERIFICATION_LOG.md`

## Related Specs

- `docs/PRODUCTION_READINESS.md`
- `docs/BACKEND_CONTRACT.md`

## Interface Notes

- contract changes allowed:
  - no
- store shape changes allowed:
  - no
- controller action changes allowed:
  - no
- route param changes allowed:
  - no

## Verification

- slice gate:
  - auth launch no longer depends on sample delivery or callback placeholders
- generation needed:
  - none
- final verifier handoff:
  - include provider names, callback domains, production env confirmation, and validation evidence

## Acceptance

- [ ] production SMS provider is configured and validated
- [ ] production OAuth provider is configured and callback domains are registered
- [ ] auth env mode toggles are enabled only on the intended deployed targets
- [ ] login and identity verification evidence is captured in release logs
- [ ] code verification intentionally skipped if rollout remains docs and ops only

## Implementation Notes

- repo code already fails closed when auth production mode lacks a real SMS or OAuth adapter
- `/ops/diagnostics` now exposes `providerReadiness.auth.sms` and `providerReadiness.auth.oauth` so the deployed target posture is visible before manual signoff
- release docs now require operator evidence for provider names, callback domains, target env confirmation, and login or bind validation

## Verification Notes

- docs-only operator handoff update; no additional code verification was needed for this card
