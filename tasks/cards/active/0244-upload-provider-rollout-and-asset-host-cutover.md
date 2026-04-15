# Card 0244 Upload Provider Rollout And Asset Host Cutover

## Summary

Execute the remaining operator-owned upload rollout for object storage, review provider, and asset host configuration.

## Goal

Provision real upload review and storage backends, switch asset URL hosts where needed, and capture release evidence for upload governance.

## Milestone

- milestone file: none
- slice name: `upload provider rollout and asset host cutover`

## Priority

- priority: `P0`

## Scope

- In scope:
  - provision production object storage and review backends outside tracked source
  - configure `MINIX_UPLOAD_PROVIDER_MODE`, `MINIX_UPLOAD_STORAGE_PROVIDER`, `MINIX_UPLOAD_REVIEW_PROVIDER`, and `MINIX_UPLOAD_ASSET_BASE_URL`
  - validate upload, retry, cancel, attachment, and returned asset URLs against the deployed target
  - capture governance and retention ownership evidence
- Out of scope:
  - changing the shared upload route set

## Ownership

- owned files:
  - `docs/PRODUCTION_READINESS.md`
  - `docs/RELEASE_RUNBOOK.md`
  - `docs/VERIFICATION_LOG.md`
- allowed generated outputs:
  - none
- forbidden files:
  - committed bucket ids, review secrets, or private asset host credentials

## Dependencies

- depends on:
  - `tasks/cards/done/0236-upload-storage-and-review-provider-cutover.md`
- blocked by:
  - selected storage and review providers plus target asset host ownership
- integration notes:
  - repository code already projects production posture; remaining work is infrastructure rollout and validation

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
  - upload release no longer depends on sample review or storage posture
- generation needed:
  - none
- final verifier handoff:
  - include provider labels, asset host URL, and validation evidence

## Acceptance

- [ ] production upload review and storage providers are configured on the target environment
- [ ] asset host URL rollout is configured and validated
- [ ] upload governance ownership and retention expectations are recorded
- [ ] upload validation evidence is captured in release logs
- [ ] code verification intentionally skipped if rollout remains docs and ops only
