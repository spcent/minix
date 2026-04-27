# Card 0434 Novel H5 Component Action Row Adoption

## Summary

Adopt the Novel H5 action-row primitive inside reusable render components.

## Goal

Remove component-level hand-written `nh-actions` wrappers from reusable Novel H5 render components so pages and components share the same filtering and markup behavior.

## Milestone

- milestone file: none
- slice name: `novel h5 component action row adoption`

## Priority

- priority: `P3`

## Scope

- In scope:
  - adopt `renderActionRow` in `novel-card`
  - adopt `renderActionRow` in reader panel body rendering
  - focused host/typecheck verification
- Out of scope:
  - changing page-level reader layout
  - changing action labels or controller action names
  - generated registry or manifest edits

## Ownership

- owned files:
  - `apps/novel-h5/src/render/components/novel-card.ts`
  - `apps/novel-h5/src/render/components/reader-panels.ts`
  - `tasks/cards/active/0434-novel-h5-component-action-row-adoption.md`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host registries
  - generated manifests

## Dependencies

- depends on:
  - `tasks/cards/active/0429-novel-h5-render-primitives-consolidation.md`
- blocked by:
  - none
- integration notes:
  - This keeps action row behavior host-local and does not move view primitives into shared feature packages.

## Affected Paths

- `apps/novel-h5/src/render/components/novel-card.ts`
- `apps/novel-h5/src/render/components/reader-panels.ts`

## Related Specs

- `docs/modules/hosts.md`
- `specs/dependency-rules.yaml`

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
  - `pnpm verify:host novel-h5`
  - `pnpm typecheck`
- generation needed:
  - none
- final verifier handoff:
  - component output should preserve button data attributes and omit empty action rows.

## Acceptance

- [ ] change is local and reversible
- [ ] write set matches ownership
- [ ] boundaries still match specs
- [ ] host wiring remains manifest- and registry-driven
- [ ] generated files were regenerated, not manually authored as source
- [ ] docs updated if behavior or workflow changed
- [ ] `pnpm verify` run, or skipped with reason if docs-only
