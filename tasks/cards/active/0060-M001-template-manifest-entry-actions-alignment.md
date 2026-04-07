# M001 Card 0060 Template Manifest Entry Actions Alignment

## Summary

Align scaffolded feature manifests with the new controller vocabulary so every business template has predictable host entry actions by default.

## Goal

Update generated `feature.manifest.ts` source so `auth`, `profile`, `list`, `detail`, `form`, and `workspace` declare template-appropriate `entryActions` for H5 and WeChat.

## Milestone

- milestone file: `tasks/milestones/M001-v1.0-release-readiness.md`
- slice name: `scaffold manifest host defaults`

## Scope

- In scope:
  - map template controller methods to default host `entryActions`
  - keep WeChat-specific refresh or reach-bottom actions only where the template semantics justify them
  - update manifest scaffold tests to assert host entry-action shape
- Out of scope:
  - changing real host manifests under `apps/*`
  - changing `packages/core/src/runtime/manifest.ts`
  - adding new host lifecycle events

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
  - `0058-M001-template-controller-method-contracts.md`
  - `0059-M001-template-model-default-state-upgrade.md`
- blocked by:
  - none
- integration notes:
  - `entryActions` must reference methods that actually exist in the generated controller for that template

## Affected Paths

- `packages/tooling/src/scaffold-feature.ts`
- `packages/tooling/src/scaffold-feature.test.ts`

## Related Specs

- `docs/ARCHITECTURE.md`
- `docs/AGENT_GUIDE.md`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - none beyond generated scaffold state
- controller action changes allowed:
  - only as needed to match generated `entryActions`
- route param changes allowed:
  - none

## Verification

- slice gate:
  - every scaffold template generates a manifest whose `entryActions` map references valid generated controller methods
- generation needed:
  - none
- final verifier handoff:
  - record the H5 and WeChat `entryActions` matrix by template

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] no manifest points at a missing controller action
- [ ] WeChat-only behaviors remain limited to template-appropriate cases
- [ ] `pnpm test packages/tooling/src/scaffold-feature.test.ts` run

