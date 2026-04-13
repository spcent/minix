# Card 0120 Release Docs And Production Readiness Gates

## Summary

Update docs, contracts, runbooks, and release gates for production-complete business domains.

## Goal

Make production readiness explicit by documenting behavior, provider setup, known limits, manual gates, and release go/no-go criteria.

## Milestone

- milestone file: none
- slice name: `release docs and production readiness gates`

## Priority

- priority: `P2`

## Scope

- In scope:
  - update backend contract docs for productionized auth, payment, upload, messaging, content, search, feedback, settings, and account flows
  - add provider setup notes without committing secrets
  - document environment variables, callback URLs, storage buckets, job schedules, and host capability support
  - add release readiness checklist with automated and manual gates
  - record accepted deferred issues and non-production modes explicitly
- Out of scope:
  - implementing domain behavior directly in docs

## Ownership

- owned files:
  - `docs/**`
  - `README.md`
  - `tasks/cards/**`
  - `package.json` only if release scripts or gate names change
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/**` unless documenting exported inline comments is required
  - `apps/**` unless script references must be updated

## Dependencies

- depends on:
  - `0119-production-e2e-and-regression-matrix.md`
  - all P0 production-completeness cards
- blocked by:
  - final provider choices and deployment endpoints
- integration notes:
  - keep docs synchronized with actual behavior and avoid claiming provider support before implementation is verified

## Affected Paths

- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`
- `docs/AGENT_GUIDE.md`
- `README.md`
- `tasks/cards/**`
- `package.json`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`
- `docs/AGENT_GUIDE.md`

## Interface Notes

- contract changes allowed:
  - none in this docs card
- store shape changes allowed:
  - none
- controller action changes allowed:
  - none
- route param changes allowed:
  - none

## Verification

- slice gate:
  - docs and release gates accurately distinguish production behavior, sample mode, reserved paths, and deferred work
- generation needed:
  - none
- final verifier handoff:
  - include release readiness checklist and deferred issue list

## Acceptance

- [x] backend contract docs reflect productionized behavior
- [x] provider setup and environment variables are documented without secrets
- [x] host capability support matrix is documented
- [x] release gate checklist includes automated and manual validation
- [x] accepted deferred issues are explicit
- [x] docs-only validation decision or `pnpm verify` result is recorded

## Verification Record

- `pnpm verify`
- `pnpm verify:release`
