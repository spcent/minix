# Card 0411 Share Schema Defined Field Normalization

## Summary

Normalize share schema defined-field mapping.

## Goal

Reduce verbose optional-field normalization in share prepare schemas so landing targets, payloads, channels, attribution, and redirect targets use the same defined-field convention as the rest of the API.

## Milestone

- milestone file: none
- slice name: `share schema defined field normalization`

## Priority

- priority: `P3`

## Scope

- In scope:
  - share prepare schema normalization
  - defined-field API helper adoption
  - API verification and typecheck
- Out of scope:
  - changing share attribution semantics
  - changing redirect target contracts
  - changing provider behavior

## Ownership

- owned files:
  - `apps/api/src/domains/share/schemas.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - shared contracts unless behavior changes

## Dependencies

- depends on:
  - `0406-api-defined-field-helper`
- blocked by:
  - none
- integration notes:
  - Keep normalized context snapshots and auth redirect targets explicit, then attach them only when defined.

## Affected Paths

- `apps/api/src/domains/share/schemas.ts`

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
  - share prepare normalization still omits undefined optional fields without dropping required fields.

## Implementation Notes

- Adopted `pickDefinedApiFields` across share landing target, payload, channel, attribution, and redirect target normalization.
- Kept source/actor context and auth redirect target normalization explicit before optional attachment.
- Preserved required share payload, channel, and attribution fields as direct assignments.

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
