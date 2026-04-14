# Card 0238 Platform Launch Config And Host Validation

## Summary

Track the remaining operator-owned launch blockers around environment bindings, allowlists, host validation, and release evidence.

## Goal

Turn the current release-readiness documentation into a concrete launch task set for H5, WeChat, API, and Worker deployments.

## Milestone

- milestone file: none
- slice name: `platform launch config and host validation`

## Priority

- priority: `P0`

## Scope

- In scope:
  - verify production environment variables, DB/KV bindings, and Worker configuration
  - verify WeChat domain allowlists and H5 CORS/origin setup
  - capture required prelaunch validation for H5 blackbox, WeChat device verification, and release evidence
  - document operator responsibilities and release signoff sequence
- Out of scope:
  - changing unrelated business-domain contracts

## Ownership

- owned files:
  - `docs/PRODUCTION_READINESS.md`
  - `docs/RELEASE_RUNBOOK.md`
  - `docs/PRODUCTION_REGRESSION_MATRIX.md`
  - verification scripts if launch checks need tightening
- allowed generated outputs:
  - none
- forbidden files:
  - committed production secrets or private deployment ids

## Dependencies

- depends on:
  - `tasks/cards/done/0120-release-docs-and-production-readiness-gates.md`
- blocked by:
  - target deployment environment ownership and production credentials
- integration notes:
  - keep launch tasks explicit about operator-owned setup versus repository-owned verification

## Affected Paths

- `docs/PRODUCTION_READINESS.md`
- `docs/RELEASE_RUNBOOK.md`
- `docs/PRODUCTION_REGRESSION_MATRIX.md`
- verification scripts under `scripts/**` if needed

## Related Specs

- `docs/PRODUCTION_READINESS.md`
- `docs/RELEASE_RUNBOOK.md`

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
  - launch blockers are explicit enough that operations can execute a release without hidden setup assumptions
- generation needed:
  - none
- final verifier handoff:
  - include launch checklist by host and environment

## Acceptance

- [x] production env vars, DB/KV bindings, and allowlists are enumerated and validated
- [x] H5 prelaunch verification and WeChat manual validation steps are explicit
- [x] release evidence requirements and signoff owners are documented
- [x] operator-owned setup is clearly separated from repo-owned checks
- [x] code verification intentionally skipped if docs-only
