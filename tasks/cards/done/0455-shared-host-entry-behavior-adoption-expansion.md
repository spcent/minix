# Card 0455 Shared Host Entry Behavior Adoption Expansion

## Summary

Adopt the shared host entry behavior helper across the remaining feature manifests with duplicated H5/Wechat action maps.

## Goal

Make feature manifests clearer and easier to reuse in future product hosts by keeping common entry actions in one typed map and isolating host-only actions.

## Milestone

- milestone file: none
- slice name: `shared host entry behavior adoption expansion`

## Scope

- In scope:
  - migrate remaining feature manifests that still repeat H5/Wechat `entryActions`
  - preserve host-only WeChat actions as explicit additions
  - run feature manifest and generation checks
- Out of scope:
  - controller behavior changes
  - route or contract changes
  - generated host manifest edits

## Ownership

- owned files:
  - `packages/features/*/src/feature.manifest.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests and registries

## Dependencies

- depends on:
  - `tasks/cards/done/0453-shared-host-entry-behavior-helper.md`
- blocked by:
  - none
- integration notes:
  - Use the helper only where common actions are obvious; host-specific actions must remain visible in the host additions block.

## Affected Paths

- `packages/features/*/src/feature.manifest.ts`

## Related Specs

- `specs/dependency-rules.yaml`
- `specs/repo.yaml`
- `docs/AGENT_GUIDE.md`

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
  - `node --import tsx --test packages/features/**/*.test.ts`
  - `pnpm typecheck`
  - `node --import tsx scripts/sync-host-manifests.ts --check`
- generation needed:
  - none
- final verifier handoff:
  - Remaining feature manifests should avoid duplicated H5/Wechat action maps when a shared map is sufficient.

## Acceptance

## Implementation Notes

- Adopted `defineSharedHostBehavior` in the remaining feature manifests with duplicated host action maps.
- Kept WeChat-only actions explicit for auth, bookshelf, catalog, and novel detail surfaces.
- Confirmed no feature manifests still use a hand-authored top-level `hosts: { ... }` map.

## Verification Notes

- Ran `node --import tsx --test packages/features/**/*.test.ts`.
- Ran `pnpm typecheck`.
- Ran `node --import tsx scripts/sync-host-manifests.ts --check`.

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
