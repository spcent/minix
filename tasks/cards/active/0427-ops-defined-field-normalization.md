# Card 0427 Ops Defined Field Normalization

## Summary

Normalize operational optional field assembly.

## Goal

Use existing defined-field helpers in operational jobs and routes so diagnostics and job request assembly preserve one optional-field convention.

## Milestone

- milestone file: none
- slice name: `ops defined field normalization`

## Priority

- priority: `P3`

## Scope

- In scope:
  - operational domain schema optional record id
  - operational job scheduling optional inputs
  - ops route diagnostics and job-run options
  - API verification and typecheck
- Out of scope:
  - changing operational job behavior
  - changing provider readiness semantics
  - changing contracts

## Ownership

- owned files:
  - `apps/api/src/domains/ops/jobs.ts`
  - `apps/api/src/domains/ops/routes.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - shared contracts unless behavior changes

## Dependencies

- depends on:
  - `0406-api-defined-field-helper`
  - `0419-domain-defined-snapshot-helper`
- blocked by:
  - none
- integration notes:
  - Keep provider readiness evidence construction explicit because it mixes environment data with runtime snapshots.

## Affected Paths

- `apps/api/src/domains/ops/jobs.ts`
- `apps/api/src/domains/ops/routes.ts`

## Related Specs

- `docs/modules/api.md`
- `docs/BACKEND_CONTRACT.md`

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
  - `pnpm verify:api`
  - `pnpm typecheck`
- generation needed:
  - none
- final verifier handoff:
  - Operational diagnostics and job queue API tests should keep passing.

## Implementation Notes

- Pending.

## Verification Notes

- Pending.

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
