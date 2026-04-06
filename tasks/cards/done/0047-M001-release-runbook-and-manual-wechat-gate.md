# M001 Card 0047 Release Runbook And Manual Wechat Gate

## Summary

Add a release runbook that covers the parts of `v1.0` promotion which remain manual, especially WeChat-side validation and deployment approval steps.

## Goal

Prevent `v1.0` release from depending on tribal knowledge by making the final RC and release checklist explicit, repeatable, and reviewable.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `release operations runbook`

## Scope

- In scope:
  - write the end-to-end RC and final release checklist
  - define manual WeChat validation expectations that complement automated gates
  - document rollback and hotfix expectations for the official samples and API
  - record which commands, environments, and approvals must happen before tagging
- Out of scope:
  - implementing a full release management system
  - automating every WeChat console action
  - changing the product scope of `v1.0`

## Ownership

- owned files:
  - `README.md`
  - `docs/**`
  - `tasks/milestones/**`
  - optional `scripts/**` for release checklist helpers
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/**`
  - `apps/**` except docs nested under apps

## Dependencies

- depends on:
  - `0043-M001-cloudflare-remote-api-deploy-and-env-promotion.md`
  - `0045-M001-h5-blackbox-release-smoke.md`
- blocked by:
  - final decision on preview and production environment names
- integration notes:
  - this card should close the gap between repo verification and actual operator release behavior

## Affected Paths

- `README.md`
- `docs/*`
- `tasks/milestones/*`
- optional `scripts/*`

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
  - docs review plus any scripted checklist helper must pass its own usage validation
- generation needed:
  - none
- final verifier handoff:
  - produce a single release checklist that can be followed without reading scattered issue history

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
