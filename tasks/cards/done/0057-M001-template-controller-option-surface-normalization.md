# M001 Card 0057 Template Controller Option Surface Normalization

## Summary

Normalize the controller option surface across scaffold templates so host wiring can rely on stable option names such as `loginRouteId`, `settingsRouteId`, `detailRouteId`, `successRouteId`, and `cancelRouteId`.

## Goal

Update scaffolded manifest/controller source for `auth`, `profile`, `list`, `detail`, `form`, and `workspace` so each template advertises a predictable controller option shape.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `scaffold controller option contracts`

## Scope

- In scope:
  - define template-specific `XxxFeatureControllerOptions` shapes
  - propagate those option fields into `createXxxController(...)`
  - align generated route option names across templates
  - update scaffold tests to assert the expected option fields exist
- Out of scope:
  - changing runtime manifest typing in `packages/core`
  - changing real feature packages under `packages/features/**`
  - expanding `scaffold:page` consumption logic

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
  - `0056-M001-auth-and-workspace-template-source-generators.md`
- blocked by:
  - none
- integration notes:
  - use stable names that `scaffold-host-page.ts` can parse without template-specific exceptions

## Affected Paths

- `packages/tooling/src/scaffold-feature.ts`
- `packages/tooling/src/scaffold-feature.test.ts`

## Related Specs

- `packages/features/README.md`
- `README.md`
- `AGENTS.md`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - only inside generated scaffold source text
- controller action changes allowed:
  - only to support the normalized option set
- route param changes allowed:
  - generated controller options may add route ids, but existing names should not be silently renamed

## Verification

- slice gate:
  - each template emits the expected route and config option keys in its generated `feature.manifest.ts`
- generation needed:
  - none
- final verifier handoff:
  - record the final option matrix by template

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] option names are consistent across templates where semantics match
- [ ] no template loses `initialState`
- [ ] `pnpm test packages/tooling/src/scaffold-feature.test.ts` run

