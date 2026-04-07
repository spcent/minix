# M001 Card 0055 Scaffold Template Enum And CLI Expansion

## Summary

Expand `scaffold:feature` template enumeration from page-shape-only values to business-oriented templates so later scaffold upgrades have a stable public entry point.

## Goal

Teach `packages/tooling/src/scaffold-feature.ts` to recognize `auth` and `workspace` in addition to the existing templates, and make the CLI help, validation, and tests reflect the new supported template surface.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `feature scaffold template surface`

## Scope

- In scope:
  - update `FeatureTemplate` to include `auth` and `workspace`
  - update the supported template list and normalization logic
  - update scaffold usage/help text where template names are surfaced
  - add or update focused tests for template normalization and invalid-template rejection
- Out of scope:
  - generating new controller, model, or manifest source for `auth` or `workspace`
  - changing `scaffold:page`
  - changing any existing feature package output outside template recognition

## Ownership

- owned files:
  - `packages/tooling/src/scaffold-feature.ts`
  - `packages/tooling/src/scaffold-feature.test.ts`
  - optional docs that list scaffold template names
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/features/**`
  - `apps/**`
  - `packages/core/**`

## Dependencies

- depends on:
  - none
- blocked by:
  - none
- integration notes:
  - later cards will rely on these template names being stable, so do not rename them after landing

## Affected Paths

- `packages/tooling/src/scaffold-feature.ts`
- `packages/tooling/src/scaffold-feature.test.ts`
- optional `README.md`
- optional `AGENTS.md`
- optional `docs/AGENT_GUIDE.md`

## Related Specs

- `README.md`
- `AGENTS.md`
- `docs/AGENT_GUIDE.md`
- `specs/repo.yaml`

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
  - `normalizeFeatureTemplate()` accepts `auth` and `workspace` and still rejects invalid values
- generation needed:
  - none
- final verifier handoff:
  - record the exact supported template list exposed by `scaffold:feature`

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] existing template names remain backward compatible
- [ ] docs updated if scaffold usage text changed
- [ ] `pnpm test packages/tooling/src/scaffold-feature.test.ts` run, or skipped with reason if docs-only

