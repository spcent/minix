# M001 Card 0062 Scaffold Template Test Matrix Expansion

## Summary

Expand scaffold tests so new template behaviors are pinned down before `scaffold:page` consumes them more deeply.

## Goal

Build a stronger test matrix around `packages/tooling/src/scaffold-feature.ts` covering new template names, generated method names, option surfaces, model fields, and entry-action defaults.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `scaffold tooling test coverage`

## Scope

- In scope:
  - add tests for `auth` and `workspace` template generation
  - add tests for normalized option surfaces across templates
  - add tests for controller method vocabulary across templates
  - add tests for template-specific `entryActions`
  - keep existing list/detail/form/profile tests passing
- Out of scope:
  - expanding general repo test infrastructure
  - adding browser or end-to-end smoke tests
  - changing `scaffold:page` behavior directly

## Ownership

- owned files:
  - `packages/tooling/src/scaffold-feature.test.ts`
  - optional `packages/tooling/src/scaffold-host-page.test.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/features/**`
  - `apps/**`

## Dependencies

- depends on:
  - `0055-M001-scaffold-template-enum-and-cli-expansion.md`
  - `0056-M001-auth-and-workspace-template-source-generators.md`
  - `0057-M001-template-controller-option-surface-normalization.md`
  - `0058-M001-template-controller-method-contracts.md`
  - `0059-M001-template-model-default-state-upgrade.md`
  - `0060-M001-template-manifest-entry-actions-alignment.md`
  - `0061-M001-workspace-template-for-upload-and-share.md`
- blocked by:
  - none
- integration notes:
  - this card should lock the scaffold surface before host-page consumers depend on it more heavily

## Affected Paths

- `packages/tooling/src/scaffold-feature.test.ts`
- optional `packages/tooling/src/scaffold-host-page.test.ts`

## Related Specs

- `README.md`
- `AGENTS.md`
- `docs/AGENT_GUIDE.md`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - none
- controller action changes allowed:
  - none directly; tests only
- route param changes allowed:
  - none directly; tests only

## Verification

- slice gate:
  - the scaffold test suite explicitly covers every supported template and its expected generated surface
- generation needed:
  - none
- final verifier handoff:
  - record which test cases protect template enum, options, methods, models, and entry-actions

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] all supported templates have direct test coverage
- [ ] regression coverage exists for previous template behavior
- [ ] `pnpm test packages/tooling/src/scaffold-feature.test.ts` run

