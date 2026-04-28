# Card 0463 H5 Storage Result Discipline

## Summary

Normalize H5 storage read/write failures into `Result<T>` instead of allowing storage exceptions to escape.

## Goal

Keep browser storage behavior aligned with the repo-wide Result discipline so shared controllers can reuse the H5 adapter safely across products, even when localStorage contains malformed data or browser storage writes fail.

## Milestone

- milestone file: none
- slice name: `h5 storage result discipline`

## Priority

- priority: `P1`

## Scope

- In scope:
  - catch JSON parse failures during H5 storage reads
  - catch storage write/remove/clear exceptions
  - keep unsupported-storage failures unchanged
  - add focused H5 storage adapter tests
- Out of scope:
  - changing storage adapter interface
  - adding migrations or data repair workflows
  - changing WeChat storage behavior

## Ownership

- owned files:
  - `packages/platform-h5/src/adapters/storage.adapter.ts`
  - `packages/platform-h5/src/adapters/storage.adapter.test.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests and registries

## Dependencies

- depends on:
  - `tasks/cards/done/0462-request-query-url-helper-parity.md`
- blocked by:
  - none
- integration notes:
  - Preserve existing namespace clear semantics.

## Affected Paths

- `packages/platform-h5/src/adapters/storage.adapter.ts`
- `packages/platform-h5/src/adapters/storage.adapter.test.ts`

## Related Specs

- `docs/modules/platform-h5.md`

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
  - H5 storage adapter tests pass
- generation needed:
  - none
- final verifier handoff:
  - confirm malformed persisted values and storage exceptions now return `STORAGE_ERROR`.

## Acceptance

- [ ] malformed JSON reads return `STORAGE_ERROR`
- [ ] storage mutation exceptions return `STORAGE_ERROR`
- [ ] namespace clear behavior is preserved
- [ ] targeted tests pass
