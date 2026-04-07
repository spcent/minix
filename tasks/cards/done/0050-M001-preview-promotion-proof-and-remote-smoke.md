# M001 Card 0050 Preview Promotion Proof And Remote Smoke

## Summary

Add a preview-stage verification path that proves the deployed API and official sample hosts work before any production promotion.

## Goal

Reduce release risk by turning preview verification into a repeatable proof step instead of a manual memory-based sequence.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `preview promotion proof`

## Scope

- In scope:
  - define a preview verification command or scripted checklist that targets remote preview URLs
  - include remote API verification and any H5 host verification that can run outside localhost
  - document the evidence needed before promoting preview to production
  - keep the proof path aligned with the release runbook
- Out of scope:
  - full browser automation for WeChat
  - changing the frozen release scope
  - introducing a separate release-management system

## Ownership

- owned files:
  - `README.md`
  - `docs/**`
  - `scripts/**`
  - optional `tests/**`
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/**`
  - `apps/**` except docs nested under apps

## Dependencies

- depends on:
  - `0048-M001-h5-remote-host-deploy-and-origin-alignment.md`
  - `0049-M001-wechat-private-config-and-domain-whitelist.md`
- blocked by:
  - stable preview API URL and preview H5 host URLs
- integration notes:
  - this card should complement the runbook, not replace it

## Affected Paths

- `README.md`
- `docs/**`
- `scripts/**`
- `tests/**`

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
  - preview verification proves the remote API and remote H5 hosts can complete their intended smoke paths
- generation needed:
  - none
- final verifier handoff:
  - record the preview evidence bundle required before production promotion

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
