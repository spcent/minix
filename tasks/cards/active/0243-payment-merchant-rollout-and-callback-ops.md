# Card 0243 Payment Merchant Rollout And Callback Ops

## Summary

Execute the remaining operator-owned payment launch work for merchant credentials, callback routing, and reconciliation evidence.

## Goal

Provision real merchant configuration, route production callbacks correctly, and capture release evidence for purchase, callback verification, refund, and reconciliation.

## Milestone

- milestone file: none
- slice name: `payment merchant rollout and callback ops`

## Priority

- priority: `P0`

## Scope

- In scope:
  - provision merchant ids, callback secrets, and payment gateway routing outside tracked source
  - configure `MINIX_PAYMENT_WEBHOOK_SECRET` on the target environment
  - validate purchase, callback verification, refund, and reconciliation against the deployed target
  - capture payment rollout evidence and responsible owner
- Out of scope:
  - changing shared payment contracts or order-center route structure

## Ownership

- owned files:
  - `docs/PRODUCTION_READINESS.md`
  - `docs/RELEASE_RUNBOOK.md`
  - `docs/VERIFICATION_LOG.md`
- allowed generated outputs:
  - none
- forbidden files:
  - committed merchant credentials or callback secrets

## Dependencies

- depends on:
  - `tasks/cards/done/0234-payment-provider-cutover-and-production-reconciliation.md`
- blocked by:
  - selected merchant account and gateway routing ownership
- integration notes:
  - repository code already enforces production-safe callback posture; remaining work is external rollout and validation

## Affected Paths

- `docs/PRODUCTION_READINESS.md`
- `docs/RELEASE_RUNBOOK.md`
- `docs/VERIFICATION_LOG.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`

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
  - payment release no longer depends on sample merchant posture or undocumented callback setup
- generation needed:
  - none
- final verifier handoff:
  - include merchant rollout evidence, callback confirmation, and reconciliation proof

## Acceptance

- [ ] merchant configuration and callback secret are provisioned on the deployed target
- [ ] purchase, callback verification, refund, and reconciliation are validated against the target environment
- [ ] payment rollout owner and evidence are captured in release logs
- [ ] order-center and membership flows are signed off for the intended hosts
- [ ] code verification intentionally skipped if rollout remains docs and ops only

## Implementation Notes

- repo code already enforces production-safe callback posture and keeps payment callback readiness visible through `/ops/diagnostics`
- `/ops/diagnostics` now exposes `providerReadiness.payment.callbacks` so callback-secret readiness is visible on the deployed target before signoff
- release docs now require merchant owner, callback evidence, and purchase or refund proof in the release log
- preview and production verification can now emit repeatable evidence packs with `MINIX_REMOTE_EVIDENCE_OUTPUT=... pnpm verify:api:remote`, then render release-log snippets with `pnpm verify:api:remote:render <evidence-path> <label>`

## Verification Notes

- docs-only operator handoff update; no additional code verification was needed for this card
