# M001 Card 0064 Release Verification Log And Evidence Record

## Summary

Create the missing release verification log so MiniX `v1.0` promotion evidence is recorded in one tracked location instead of being split across terminal history, runbook text, and ad hoc notes.

## Goal

Add a tracked verification record for RC and final-release evidence, covering executed commands, remote URLs, validator identity, dates, and accepted exceptions, so the milestone requirement that verification results are recorded is actually satisfied.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `verification results recording`

## Scope

- In scope:
  - add `docs/VERIFICATION_LOG.md`
  - define the required evidence sections for preview proof, remote API verification, H5 remote verification, and manual WeChat validation
  - align `README.md`, `docs/RELEASE_RUNBOOK.md`, and the verification log structure so they point at the same evidence source of truth
  - make it explicit which values must be filled in for each RC and for the final `v1.0.0` release
- Out of scope:
  - inventing a release database or dashboard
  - changing runtime behavior
  - reworking the release runbook flow

## Ownership

- owned files:
  - `docs/VERIFICATION_LOG.md`
  - `README.md`
  - `docs/RELEASE_RUNBOOK.md`
  - optional `CHANGELOG.md`
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/**`
  - `apps/**`

## Dependencies

- depends on:
  - `0047-M001-release-runbook-and-manual-wechat-gate.md`
  - `0048-M001-h5-remote-host-deploy-and-origin-alignment.md`
  - `0049-M001-wechat-private-config-and-domain-whitelist.md`
  - `0050-M001-preview-promotion-proof-and-remote-smoke.md`
- blocked by:
  - actual RC or final verification runs if the card is being closed with real evidence instead of a ready-to-fill template only
- integration notes:
  - the repo already links to `docs/VERIFICATION_LOG.md`; this card should close that dangling reference with a real tracked file

## Affected Paths

- `docs/VERIFICATION_LOG.md`
- `README.md`
- `docs/RELEASE_RUNBOOK.md`
- optional `CHANGELOG.md`

## Related Specs

- `specs/repo.yaml`
- `specs/dependency-rules.yaml`
- `tasks/milestones/M001-v1.0-release-readiness.md`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - none
- controller action changes allowed:
  - none
- route param changes allowed:
  - none

## Verification

- slice gate:
  - the repo contains a tracked verification log with clear fields for preview, production, H5, and WeChat evidence
- generation needed:
  - none
- final verifier handoff:
  - record the exact evidence fields required before RC and before the final tag

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
