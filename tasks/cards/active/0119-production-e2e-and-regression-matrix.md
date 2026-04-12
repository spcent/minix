# Card 0119 Production E2E And Regression Matrix

## Summary

Expand verification beyond unit foundation tests into cross-host production workflow coverage.

## Goal

Cover auth, payment, upload, messaging, content, search, account, settings, feedback, and route recovery with end-to-end and regression matrices.

## Milestone

- milestone file: none
- slice name: `production e2e and regression matrix`

## Priority

- priority: `P2`

## Scope

- In scope:
  - add H5 E2E flows for login, identity upgrade, payment, upload, messaging, feedback, content lifecycle, search, settings, and account operations
  - add WeChat host validation checklist or automation where possible
  - add API integration tests for provider-like callback, upload, messaging, and job behavior
  - add route/session recovery regression matrix
  - document required manual gates where automation is not feasible
- Out of scope:
  - adding production provider credentials to the repository

## Ownership

- owned files:
  - test suites under existing test locations
  - `scripts/**` verification helpers if needed
  - `docs/**` verification docs
  - `package.json` and workspace scripts if gates are added
- allowed generated outputs:
  - test artifacts under approved output paths only
- forbidden files:
  - generated host manifests and shells as source edits

## Dependencies

- depends on:
  - `0097-auth-real-provider-and-credential-productionization.md`
  - `0100-payment-real-gateway-and-ledger-completion.md`
  - `0101-upload-object-storage-and-review-completion.md`
  - `0102-messaging-realtime-conversation-completion.md`
  - `0103-content-cms-authoring-and-review-console.md`
- blocked by:
  - provider sandboxes and host automation availability
- integration notes:
  - prefer scoped gates first, then add them to release verification after stable

## Affected Paths

- `tests/**`
- `scripts/**`
- `docs/**`
- `package.json`

## Related Specs

- `docs/AGENT_GUIDE.md`
- `docs/ARCHITECTURE.md`

## Interface Notes

- contract changes allowed:
  - none, unless test-only fixtures expose a documented gap
- store shape changes allowed:
  - none
- controller action changes allowed:
  - none
- route param changes allowed:
  - none

## Verification

- slice gate:
  - production workflows have automated coverage or an explicit manual validation record
- generation needed:
  - none
- final verifier handoff:
  - include command list, required env vars, and known manual checks

## Acceptance

- [x] H5 E2E covers critical business workflows
- [x] API integration tests cover provider-like callbacks and jobs
- [x] route/session recovery matrix is automated where possible
- [x] WeChat manual or automated validation checklist is documented
- [x] new gates are wired into release verification when stable
- [x] `pnpm verify` run
