# M001 Card 0061 Workspace Template For Upload And Share

## Summary

Use the new `workspace` template as the shared scaffold path for upload- and share-style capability features so template count stays controlled while still giving these features a useful starting point.

## Goal

Refine the generated `workspace` template so it is a credible base for `upload` and `share` feature packages without adding separate scaffold template names yet.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `capability workspace scaffold`

## Scope

- In scope:
  - tailor the `workspace` controller vocabulary around a primary action, retry, and result handling
  - tailor the `workspace` model around labels, result state, and error state
  - document in tests and scaffold output that `workspace` is the intended base for `upload` and `share`
- Out of scope:
  - adding `upload` and `share` as first-class template names
  - building real upload/share integrations
  - changing platform capability adapters

## Ownership

- owned files:
  - `packages/tooling/src/scaffold-feature.ts`
  - `packages/tooling/src/scaffold-feature.test.ts`
  - optional scaffold docs
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/integrations/**`
  - `packages/platform-*/**`
  - `apps/**`

## Dependencies

- depends on:
  - `0056-M001-auth-and-workspace-template-source-generators.md`
  - `0057-M001-template-controller-option-surface-normalization.md`
  - `0058-M001-template-controller-method-contracts.md`
  - `0059-M001-template-model-default-state-upgrade.md`
- blocked by:
  - none
- integration notes:
  - this card should avoid introducing a template explosion; `workspace` is intentionally a shared capability shell

## Affected Paths

- `packages/tooling/src/scaffold-feature.ts`
- `packages/tooling/src/scaffold-feature.test.ts`
- optional `README.md`
- optional `AGENTS.md`
- optional `docs/AGENT_GUIDE.md`

## Related Specs

- `packages/features/README.md`
- `README.md`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - only inside generated scaffold source
- controller action changes allowed:
  - yes, inside generated `workspace` scaffold source
- route param changes allowed:
  - only through the normalized generated option surface

## Verification

- slice gate:
  - a scaffolded `workspace` feature looks appropriate for both upload-style and share-style adaptation
- generation needed:
  - none
- final verifier handoff:
  - record which generated controller methods and state fields make `workspace` reusable for upload/share features

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] `workspace` remains generic enough for more than one capability feature
- [ ] docs updated if `workspace` is now positioned as the upload/share starter template
- [ ] `pnpm test packages/tooling/src/scaffold-feature.test.ts` run

