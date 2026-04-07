# M001 Card 0059 Template Model Default State Upgrade

## Summary

Increase the usefulness of scaffolded feature models by giving each business template a richer default state shape that teams can extend instead of immediately rewriting.

## Goal

Upgrade generated model source so `auth`, `profile`, `list`, `detail`, `form`, and `workspace` templates ship with template-appropriate baseline fields instead of the thinnest possible state only.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `scaffold model defaults`

## Scope

- In scope:
  - enrich generated state fields per template
  - enrich default state factory options where needed
  - keep list/detail/form templates aligned with shared page protocols while adding a small number of business-level fields
  - update scaffold tests to assert key model fields exist
- Out of scope:
  - changing page protocol helpers in `packages/core`
  - changing concrete feature package state in `packages/features/**`
  - adding new shared contracts

## Ownership

- owned files:
  - `packages/tooling/src/scaffold-feature.ts`
  - `packages/tooling/src/scaffold-feature.test.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/core/**`
  - `packages/contracts/**`
  - `apps/**`

## Dependencies

- depends on:
  - `0057-M001-template-controller-option-surface-normalization.md`
- blocked by:
  - none
- integration notes:
  - do not fight the existing page protocol factories; extend them minimally where helpful

## Affected Paths

- `packages/tooling/src/scaffold-feature.ts`
- `packages/tooling/src/scaffold-feature.test.ts`

## Related Specs

- `packages/features/README.md`
- `README.md`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - yes, within generated scaffold state only
- controller action changes allowed:
  - only if required to initialize or update the richer default state
- route param changes allowed:
  - none

## Verification

- slice gate:
  - each template emits a model with meaningful baseline fields and a working default-state factory
- generation needed:
  - none
- final verifier handoff:
  - record the core state fields provided by each template

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] list/detail/form still compose with page protocol defaults
- [ ] default state remains small but useful
- [ ] `pnpm test packages/tooling/src/scaffold-feature.test.ts` run

