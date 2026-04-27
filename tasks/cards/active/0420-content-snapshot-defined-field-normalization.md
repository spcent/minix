# Card 0420 Content Snapshot Defined Field Normalization

## Summary

Normalize managed content snapshot optional fields.

## Goal

Use the shared domain snapshot helper in managed content snapshot cloning so lifecycle, authoring, and entry optional fields stay consistent and reusable.

## Milestone

- milestone file: none
- slice name: `content snapshot defined field normalization`

## Priority

- priority: `P3`

## Scope

- In scope:
  - managed content lifecycle optional fields
  - managed content authoring optional fields
  - managed content entry optional fields
  - API verification and typecheck
- Out of scope:
  - changing managed content state
  - changing clone behavior for arrays that already use dedicated helpers
  - changing contracts

## Ownership

- owned files:
  - `apps/api/src/domains/content/snapshots.ts`
  - `apps/api/src/domains/content/snapshots.test.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - shared contracts unless behavior changes

## Dependencies

- depends on:
  - `0419-domain-defined-snapshot-helper`
- blocked by:
  - none
- integration notes:
  - Preserve deep clone behavior and undefined-field omission.

## Affected Paths

- `apps/api/src/domains/content/snapshots.ts`
- `apps/api/src/domains/content/snapshots.test.ts`

## Related Specs

- `docs/modules/api.md`
- `docs/BACKEND_CONTRACT.md`

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
  - `pnpm verify:api`
  - `pnpm typecheck`
- generation needed:
  - none
- final verifier handoff:
  - Managed content snapshot tests should still confirm cloning and optional omission.

## Implementation Notes

- Adopted `cloneDefinedDomainFields` for managed content lifecycle optional fields.
- Adopted the helper for authoring and entry subtitle, body preview, and cover asset optional fields.
- Preserved dedicated clone helpers for nested category, tags, attachments, lifecycle, review, and audit values.

## Verification Notes

- Ran `pnpm verify:api`.
- Ran `pnpm typecheck`.

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
