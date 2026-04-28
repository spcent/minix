# Card 0424 Upload Asset Defined Field Normalization

## Summary

Normalize upload asset optional field cloning.

## Goal

Use the shared domain snapshot helper in upload asset helpers so variants, metadata, and asset top-level optional fields follow one reusable defined-field policy.

## Milestone

- milestone file: none
- slice name: `upload asset defined field normalization`

## Priority

- priority: `P3`

## Scope

- In scope:
  - upload derived asset variant optional dimensions
  - upload asset metadata optional scalar fields
  - upload asset top-level optional summary fields
  - API verification and typecheck
- Out of scope:
  - changing upload contracts
  - changing upload asset schema validation
  - changing generated files

## Ownership

- owned files:
  - `apps/api/src/domains/uploads/assets.ts`
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
  - Keep variant and annotation arrays on explicit clone/mapping paths where they require shape normalization.

## Affected Paths

- `apps/api/src/domains/uploads/assets.ts`

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
  - Upload asset helper tests should keep proving zero values and nested clones are preserved.

## Implementation Notes

- Imported `cloneDefinedDomainFields` into upload asset helpers.
- Replaced repeated optional scalar spreads for variant dimensions, metadata fields, and top-level asset summaries.
- Kept `variants` mapped through `createUploadAssetVariant` and `reviewAnnotations` explicitly cloned as arrays.

## Verification Notes

- `pnpm verify:api` passed.
- `pnpm typecheck` passed.

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
