# M001 Card 0056 Auth And Workspace Template Source Generators

## Summary

Add the first two business-oriented scaffold generators so `scaffold:feature <name> auth` and `scaffold:feature <name> workspace` create meaningful feature package skeletons instead of falling back to generic page shells.

## Goal

Implement template-specific source generators for `auth` and `workspace` across controller, model, manifest, and test output in `packages/tooling/src/scaffold-feature.ts`.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `business scaffold templates`

## Scope

- In scope:
  - add `authControllerSource`, `authModelSource`, `authFeatureManifestSource`, and `authControllerTestSource`
  - add `workspaceControllerSource`, `workspaceModelSource`, `workspaceFeatureManifestSource`, and `workspaceControllerTestSource`
  - route template dispatch through the new generators
  - add focused tests for scaffolded `auth` and `workspace` output
- Out of scope:
  - normalizing route/config option surfaces across all existing templates
  - changing `scaffold:page`
  - adding `upload` or `share` as standalone template names

## Ownership

- owned files:
  - `packages/tooling/src/scaffold-feature.ts`
  - `packages/tooling/src/scaffold-feature.test.ts`
  - optional docs that explain scaffold template output
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/features/**`
  - `apps/**`
  - `packages/platform-*/**`

## Dependencies

- depends on:
  - `0055-M001-scaffold-template-enum-and-cli-expansion.md`
- blocked by:
  - none
- integration notes:
  - keep the new generators consistent with current feature package layout: `src/index.ts`, `controller`, `model`, `feature.manifest.ts`

## Affected Paths

- `packages/tooling/src/scaffold-feature.ts`
- `packages/tooling/src/scaffold-feature.test.ts`
- optional `README.md`
- optional `AGENTS.md`
- optional `docs/AGENT_GUIDE.md`

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
  - only inside generated scaffold source text
- route param changes allowed:
  - only inside generated scaffold source text

## Verification

- slice gate:
  - scaffolding an `auth` or `workspace` feature generates template-specific files instead of generic placeholders
- generation needed:
  - none
- final verifier handoff:
  - record the generated controller methods, model state fields, and manifest options for both new templates

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] generated source remains platform-agnostic
- [ ] docs updated if scaffold output expectations changed
- [ ] `pnpm test packages/tooling/src/scaffold-feature.test.ts` run

