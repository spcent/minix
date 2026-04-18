# Card 0253 Provider Adapters And Ops Hardening

## Summary

Harden the production-side adapter and rollout posture for auth, payment, upload, share, and external message providers without widening the current product surface.

## Goal

Make the existing provider-backed domains easier to operate, verify, and fail safely in production mode while preserving the current shared contracts.

## Milestone

- milestone file: none
- slice name: `provider adapters and ops hardening`

## Priority

- priority: `P1`

## Scope

- In scope:
  - tighten provider adapter expectations around auth, payment, upload, share, and message delivery
  - improve production-mode diagnostics, rollout checks, and failure posture
  - document the repo-side boundary between shared contracts and operator-owned setup
  - add repo-safe guardrails that prevent silent sample-mode fallback in production mode
- Out of scope:
  - adding new business domains
  - adding new platform families
  - replacing the current normalized domain envelopes

## Ownership

- owned files:
  - `docs/ROADMAP.md`
  - `docs/PRODUCTION_READINESS.md`
  - `docs/RELEASE_RUNBOOK.md`
  - `docs/VERIFICATION_LOG.md`
  - `apps/api/src/domains/auth`
  - `apps/api/src/domains/messages`
  - `apps/api/src/domains/payment`
  - `apps/api/src/domains/uploads`
  - `apps/api/src/domains/share`
- allowed generated outputs:
  - none
- forbidden files:
  - host-local wrappers that hide a shared production-posture gap

## Dependencies

- depends on:
  - `tasks/cards/active/0241-auth-provider-operator-rollout.md`
  - `tasks/cards/active/0242-message-provider-rollout-and-polling-acceptance.md`
  - `tasks/cards/active/0243-payment-merchant-rollout-and-callback-ops.md`
  - `tasks/cards/active/0244-upload-provider-rollout-and-asset-host-cutover.md`
  - `tasks/cards/active/0245-share-provider-rollout-and-attribution-ops.md`
- blocked by:
  - final release closure for the current `P0` queue
- integration notes:
  - treat this as post-release hardening of existing domains, not as permission to expand domain scope

## Affected Paths

- `docs/ROADMAP.md`
- `docs/PRODUCTION_READINESS.md`
- `docs/RELEASE_RUNBOOK.md`
- `docs/VERIFICATION_LOG.md`
- `apps/api/src/domains/auth`
- `apps/api/src/domains/messages`
- `apps/api/src/domains/payment`
- `apps/api/src/domains/uploads`
- `apps/api/src/domains/share`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `docs/PRODUCTION_READINESS.md`

## Interface Notes

- contract changes allowed:
  - limited, additive-only when needed for clearer provider diagnostics
- store shape changes allowed:
  - limited to production-posture and rollout metadata already implied by current domains
- controller action changes allowed:
  - yes, when needed to surface clearer degraded-mode or production-failure guidance
- route param changes allowed:
  - no new route families without a separate scope decision

## Verification

- slice gate:
  - production posture across provider-backed domains is clearer, safer, and easier to verify without changing the shared domain story
- generation needed:
  - none
- final verifier handoff:
  - include any new rollout guardrails, failure rules, and documentation updates

## Acceptance

- [x] provider-backed domains keep failing closed in production mode when required adapters are missing
- [x] rollout diagnostics and documentation are clearer for auth, messages, payment, upload, and share
- [x] no new host-local compensation layer is added for shared provider gaps
- [x] any additive contract fields remain compatible with the existing canonical envelopes
- [x] `pnpm verify` run, or skipped with reason if this remains docs-only

## Implementation Notes

- `/ops/diagnostics` now includes a shared `providerReadiness` summary for auth, messages, payment callbacks, upload, and share
- the readiness summary distinguishes `sample`, `ready`, `review`, and `blocked` posture instead of leaving provider rollout state scattered across separate domain payloads
- auth readiness now reflects whether SMS and OAuth production modes have real adapters wired, while payment, upload, share, and message readiness summarize env-backed rollout completeness
- release docs now point operators at `/ops/diagnostics` as the repo-visible readiness checkpoint for target environments

## Verification Notes

- verified through `node --import tsx --test apps/api/src/app.test.ts`
- verified through `pnpm verify:api`
