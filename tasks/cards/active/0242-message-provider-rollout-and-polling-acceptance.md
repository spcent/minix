# Card 0242 Message Provider Rollout And Polling Acceptance

## Summary

Execute the remaining operator-owned rollout for external message touchpoints and record whether polling-only delivery is acceptable for release.

## Goal

Provision real external touchpoint providers, confirm the polling-only transport stance, and capture signoff for inbox and notification behavior.

## Milestone

- milestone file: none
- slice name: `message provider rollout and polling acceptance`

## Priority

- priority: `P0`

## Scope

- In scope:
  - configure external provider labels and keys for subscription message, SMS, email, and push touchpoints
  - decide and record whether polling-only thread synchronization is acceptable for the target release
  - validate unread badge, thread send or retry, and notification fallback behavior on the deployed target
  - capture operator evidence for external delivery ownership
- Out of scope:
  - implementing a realtime transport inside the repo

## Ownership

- owned files:
  - `docs/PRODUCTION_READINESS.md`
  - `docs/RELEASE_RUNBOOK.md`
  - `docs/VERIFICATION_LOG.md`
- allowed generated outputs:
  - none
- forbidden files:
  - committed provider credentials or delivery secrets

## Dependencies

- depends on:
  - `tasks/cards/done/0235-message-touchpoint-provider-cutover-and-realtime-upgrade.md`
- blocked by:
  - selected external notification providers and release product decision on polling-only sync
- integration notes:
  - repository code already exposes provider posture explicitly; remaining work is rollout and signoff

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
  - external message rollout and transport acceptance are explicit enough for release signoff
- generation needed:
  - none
- final verifier handoff:
  - include provider posture, polling acceptance decision, and manual validation evidence

## Acceptance

- [ ] external message providers are configured or explicitly deferred by release decision
- [ ] polling-only sync is accepted or rejected explicitly for the target release
- [ ] inbox and notification manual validation evidence is captured
- [ ] provider ownership and fallback behavior are recorded in release logs
- [ ] code verification intentionally skipped if rollout remains docs and ops only

## Implementation Notes

- repo code already keeps message provider posture explicit and preserves polling-only sync as an intentional release decision instead of an accidental transport gap
- `/ops/diagnostics` now exposes `providerReadiness.messages.touchpoints` so the deployed target can show whether production channel config is complete or still in review
- release docs now require explicit polling-only acceptance notes and provider ownership evidence for the release log
- preview and production verification can now emit repeatable evidence packs with `MINIX_REMOTE_EVIDENCE_OUTPUT=... pnpm verify:api:remote`, then render release-log snippets with `pnpm verify:api:remote:render <evidence-path> <label>`

## Verification Notes

- docs-only operator handoff update; no additional code verification was needed for this card
