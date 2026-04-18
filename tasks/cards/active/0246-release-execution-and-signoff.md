# Card 0246 Release Execution And Signoff

## Summary

Track the actual execution of the release runbook after the repository-side readiness and documentation work are complete.

## Goal

Run the launch checklist against preview and production, collect evidence, and record explicit go or no-go ownership.

## Milestone

- milestone file: none
- slice name: `release execution and signoff`

## Priority

- priority: `P0`

## Scope

- In scope:
  - execute the runbook against preview and production targets
  - record command output, deployed URLs, validator names, and dates in the verification log
  - confirm release signoff owner and final go or no-go decision
- Out of scope:
  - new code changes unless a rollout issue forces another engineering slice

## Ownership

- owned files:
  - `docs/VERIFICATION_LOG.md`
  - `docs/RELEASE_RUNBOOK.md`
  - `docs/PRODUCTION_REGRESSION_MATRIX.md`
- allowed generated outputs:
  - none
- forbidden files:
  - invented verification evidence or missing-signoff release tags

## Dependencies

- depends on:
  - `tasks/cards/done/0238-platform-launch-config-and-host-validation.md`
  - `tasks/cards/active/0241-auth-provider-operator-rollout.md`
  - `tasks/cards/active/0242-message-provider-rollout-and-polling-acceptance.md`
  - `tasks/cards/active/0243-payment-merchant-rollout-and-callback-ops.md`
  - `tasks/cards/active/0244-upload-provider-rollout-and-asset-host-cutover.md`
  - `tasks/cards/active/0245-share-provider-rollout-and-attribution-ops.md`
- blocked by:
  - target environment ownership and release calendar
- integration notes:
  - this card is execution-only; do not reopen closed repository work unless rollout uncovers a new defect
  - use the prefilled `v1.0.0-rc.1` section in `docs/VERIFICATION_LOG.md` as the default execution record unless release naming changes

## Affected Paths

- `docs/VERIFICATION_LOG.md`
- `docs/RELEASE_RUNBOOK.md`
- `docs/PRODUCTION_REGRESSION_MATRIX.md`

## Related Specs

- `docs/RELEASE_RUNBOOK.md`
- `docs/PRODUCTION_REGRESSION_MATRIX.md`

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
  - release evidence is complete enough to defend a final go or no-go decision
- generation needed:
  - none
- final verifier handoff:
  - include verification log entry, deployed URLs, validators, and signoff owner

## Acceptance

- [ ] preview runbook execution is recorded with deployed URLs and command evidence
- [ ] production runbook execution is recorded with deployed URLs and command evidence
- [ ] manual WeChat validation evidence is recorded with validator name and date
- [ ] explicit go or no-go signoff owner is recorded
- [ ] code verification intentionally skipped if this remains execution and docs only

## Implementation Notes

- repo docs now make preview and production `/ops/diagnostics` provider-readiness snapshots part of the release evidence set
- `VERIFICATION_LOG.md` now includes explicit provider-readiness and rollout-evidence slots for preview and production execution
- this card remains execution-only; the remaining work is to fill the tracked template with real deployed values and signoff ownership

## Verification Notes

- docs-only operator handoff update; no additional code verification was needed for this card
