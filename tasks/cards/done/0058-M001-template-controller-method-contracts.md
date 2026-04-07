# M001 Card 0058 Template Controller Method Contracts

## Summary

Make scaffolded controllers expose predictable action names per template so host entry actions, future host-page scaffolds, and downstream teams can rely on one controller vocabulary.

## Goal

Upgrade generated controller source for every supported business template so methods such as `submitLogin`, `loadMore`, `openDetail`, `shareCurrent`, `submit`, `cancel`, and `startPrimaryAction` exist where expected.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `scaffold controller method vocabulary`

## Scope

- In scope:
  - define the default method set for `auth`, `profile`, `list`, `detail`, `form`, and `workspace`
  - update generated controller code to expose those methods
  - update controller tests so method presence and baseline state transitions are covered
- Out of scope:
  - real API calls or domain-specific business logic
  - changing runtime host entry execution in `packages/core`
  - platform-specific adapter work

## Ownership

- owned files:
  - `packages/tooling/src/scaffold-feature.ts`
  - `packages/tooling/src/scaffold-feature.test.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - `packages/core/**`
  - `apps/**`

## Dependencies

- depends on:
  - `0057-M001-template-controller-option-surface-normalization.md`
- blocked by:
  - none
- integration notes:
  - method names must stay aligned with the future `entryActions` map generated in feature manifests

## Affected Paths

- `packages/tooling/src/scaffold-feature.ts`
- `packages/tooling/src/scaffold-feature.test.ts`

## Related Specs

- `packages/features/README.md`
- `docs/AGENT_GUIDE.md`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - only as needed to support the new method defaults in generated scaffold state
- controller action changes allowed:
  - yes, inside generated scaffold source
- route param changes allowed:
  - only through generated controller option handling

## Verification

- slice gate:
  - scaffolded controllers expose the expected method names per template and tests cover at least one state transition or route helper path
- generation needed:
  - none
- final verifier handoff:
  - record the final method matrix by template

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] controller methods are template-semantic instead of generic-only
- [ ] method names stay consistent with planned host entry actions
- [ ] `pnpm test packages/tooling/src/scaffold-feature.test.ts` run

