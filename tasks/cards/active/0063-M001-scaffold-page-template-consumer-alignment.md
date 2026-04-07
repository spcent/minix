# M001 Card 0063 Scaffold Page Template Consumer Alignment

## Summary

Align `scaffold:page` with the upgraded business-oriented feature templates so host page generation can consume the richer option surface and route placeholders without special-case drift.

## Goal

Update `packages/tooling/src/scaffold-host-page.ts` and its tests to understand the new scaffold template contract, especially `auth`, `workspace`, and the normalized controller option matrix across templates.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `host page scaffold consumer alignment`

## Scope

- In scope:
  - make `scaffold-host-page.ts` consume the final template names and generated controller option keys
  - add route placeholder generation for the normalized template option surface
  - ensure `scaffold:page` still handles older generated features gracefully where possible
  - extend host-page scaffold tests to cover new template behavior
- Out of scope:
  - changing host runtime behavior
  - editing real app manifests by hand outside scaffold tests
  - adding new host lifecycle semantics

## Ownership

- owned files:
  - `packages/tooling/src/scaffold-host-page.ts`
  - `packages/tooling/src/scaffold-host-page.test.ts`
  - optional scaffold docs
- allowed generated outputs:
  - none
- forbidden files:
  - `apps/*/src/manifest/page-definitions.ts`
  - `packages/core/**`
  - generated host files outside tests

## Dependencies

- depends on:
  - `0055-M001-scaffold-template-enum-and-cli-expansion.md`
  - `0057-M001-template-controller-option-surface-normalization.md`
  - `0058-M001-template-controller-method-contracts.md`
  - `0059-M001-template-model-default-state-upgrade.md`
  - `0060-M001-template-manifest-entry-actions-alignment.md`
  - `0062-M001-scaffold-template-test-matrix-expansion.md`
- blocked by:
  - final stabilized scaffold-template option names from earlier cards
- integration notes:
  - `scaffold:page` should consume manifest-declared capability rather than hard-coding behavior by template name where possible

## Affected Paths

- `packages/tooling/src/scaffold-host-page.ts`
- `packages/tooling/src/scaffold-host-page.test.ts`
- optional `README.md`
- optional `AGENTS.md`
- optional `docs/AGENT_GUIDE.md`

## Related Specs

- `README.md`
- `AGENTS.md`
- `docs/AGENT_GUIDE.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - none
- controller action changes allowed:
  - none directly; consumer alignment only
- route param changes allowed:
  - generated controller placeholders may expand, but route contract ownership must remain with `packages/contracts`

## Verification

- slice gate:
  - `scaffold:page` generates route-aware controller placeholders that match the upgraded feature template option surface
- generation needed:
  - none
- final verifier handoff:
  - record which template options `scaffold:page` understands and how missing route ids are represented

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] `scaffold:page` remains backward compatible with existing scaffolded features where feasible
- [ ] docs updated if host-page scaffold behavior changed
- [ ] `pnpm test packages/tooling/src/scaffold-host-page.test.ts` run

