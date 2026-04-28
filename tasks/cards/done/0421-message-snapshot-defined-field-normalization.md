# Card 0421 Message Snapshot Defined Field Normalization

## Summary

Normalize message snapshot optional fields.

## Goal

Use the shared domain snapshot helper in message snapshot cloning so thread members, thread metadata, and message delivery fields keep one optional-field convention.

## Milestone

- milestone file: none
- slice name: `message snapshot defined field normalization`

## Priority

- priority: `P3`

## Scope

- In scope:
  - message thread member optional fields
  - message thread optional metadata fields
  - message body delivery optional fields
  - API verification and typecheck
- Out of scope:
  - changing message delivery behavior
  - changing touchpoint behavior
  - changing contracts

## Ownership

- owned files:
  - `apps/api/src/domains/messages/snapshots.ts`
  - `apps/api/src/domains/messages/snapshots.test.ts`
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
  - Preserve custom member cloning and touchpoint cloning.

## Affected Paths

- `apps/api/src/domains/messages/snapshots.ts`
- `apps/api/src/domains/messages/snapshots.test.ts`

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
  - Message snapshot tests should still confirm cloning and optional omission.

## Implementation Notes

- Adopted `cloneDefinedDomainFields` for message thread member `joinedAt`.
- Adopted the helper for thread reply policy, cloned metadata objects, and touchpoint resource creation time.
- Adopted the helper for message delivery and failure optional fields while preserving custom touchpoint cloning.

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
