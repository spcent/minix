# Card 0460 Core Capability Payload Helper Adoption

## Summary

Move repeated capability payload parsing out of platform adapters and into reusable core runtime helpers.

## Goal

Keep H5 and WeChat capability adapters consistent when reading action payload text and resolving share fallback targets, so future product hosts can reuse the same rules instead of copying platform-local parsing.

## Milestone

- milestone file: none
- slice name: `core capability payload helper adoption`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add core helpers for capability text payload extraction and share target resolution
  - replace duplicated H5 and WeChat adapter logic with the shared helpers
  - add focused core tests for helper behavior
- Out of scope:
  - changing capability contracts
  - changing host-specific capability availability checks
  - changing upload chunking or payment behavior

## Ownership

- owned files:
  - `packages/core/src/runtime/capability.ts`
  - `packages/core/src/runtime/capability.test.ts`
  - `packages/platform-h5/src/adapters/capability.adapter.ts`
  - `packages/platform-wechat/src/adapters/capability.adapter.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests and registries

## Dependencies

- depends on:
  - none
- blocked by:
  - none
- integration notes:
  - Preserve package entry-point imports; platform packages should import helpers from `@minix/core`.

## Affected Paths

- `packages/core/src/runtime/capability.ts`
- `packages/platform-h5/src/adapters/capability.adapter.ts`
- `packages/platform-wechat/src/adapters/capability.adapter.ts`

## Related Specs

- `docs/architecture/layers.md`
- `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`

## Interface Notes

- contract changes allowed:
  - no
- store shape changes allowed:
  - no
- controller action changes allowed:
  - no
- route param changes allowed:
  - no

## Verification

- slice gate:
  - shared helper tests and platform adapter tests pass
- generation needed:
  - none
- final verifier handoff:
  - note that behavior is unchanged and only payload parsing ownership moved.

## Acceptance

- [x] capability payload text extraction is centralized in core
- [x] share fallback target resolution is centralized in core
- [x] H5 and WeChat adapters use the shared helpers
- [x] targeted tests pass

## Implementation Notes

- Added `resolveCapabilityPayloadText` and `resolveShareTargetText` to core runtime capability helpers.
- Replaced duplicate H5 and WeChat capability adapter parsing logic with the shared helpers.
- Added focused core tests for text payload and share target resolution behavior.

## Verification Notes

- `node --import tsx --test packages/core/src/runtime/capability.test.ts packages/platform-h5/src/adapters/capability.adapter.test.ts packages/platform-wechat/src/adapters/capability.adapter.test.ts`
- `pnpm typecheck`
