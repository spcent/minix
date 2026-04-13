# Card 0101 Upload Object Storage And Review Completion

## Summary

Replace upload reservation flow with real object storage, binary transfer, review, and cleanup governance.

## Goal

Implement complete file lifecycle from selection through upload, validation, storage, review, resource binding, retry/cancel, and expiration cleanup.

## Milestone

- milestone file: none
- slice name: `upload object storage and review completion`

## Priority

- priority: `P0`

## Scope

- In scope:
  - add signed upload session contracts and backend endpoints for binary/object-storage transfer
  - implement file type, size, checksum, and ownership validation
  - support chunk/resume semantics beyond `chunking_reserved`
  - integrate review status with sensitive-content and attachment-governance outputs
  - add cleanup job records and resource reference backfill for feedback/content/avatar attachments
- Out of scope:
  - provider-specific media transcoding beyond required thumbnail/metadata fields

## Ownership

- owned files:
  - `packages/contracts/src/api/upload.ts`
  - `packages/features/media-tools/src/**`
  - `packages/features/feedback/src/**`
  - `packages/platform-h5/src/adapters/capability.adapter.ts`
  - `packages/platform-wechat/src/adapters/capability.adapter.ts`
  - `apps/api/src/app.ts`
  - `apps/api/src/store*.ts`
  - upload tests
- allowed generated outputs:
  - none unless host upload pages are added
- forbidden files:
  - generated host manifests and shells

## Dependencies

- depends on:
  - `0085-upload-media-pipeline-productionization.md`
- blocked by:
  - object storage provider and content review provider choice
- integration notes:
  - keep platform file selection inside platform adapters; shared feature code must only use capability ports

## Affected Paths

- `packages/contracts/src/api/upload.ts`
- `packages/features/media-tools/src/controller/index.ts`
- `packages/features/feedback/src/controller/index.ts`
- `packages/platform-h5/src/adapters/capability.adapter.ts`
- `packages/platform-wechat/src/adapters/capability.adapter.ts`
- `apps/api/src/app.ts`
- `apps/api/src/store.ts`
- `apps/api/src/store.d1.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/ARCHITECTURE.md`

## Interface Notes

- contract changes allowed:
  - yes, for upload sessions, chunks, checksums, review provider output, and cleanup state
- store shape changes allowed:
  - yes, for durable upload tasks and asset references
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, if dedicated upload/detail pages are added

## Verification

- slice gate:
  - upload can transfer a real file to backend/object storage and produce a durable asset reference
- generation needed:
  - none unless host pages are added
- final verifier handoff:
  - include large-file, retry, cancel, rejected-review, and cleanup cases

## Acceptance

- [x] object-storage upload session is implemented
- [x] binary transfer and checksum validation are implemented
- [x] chunk/resume is no longer only reserved semantics
- [x] review and cleanup states are durable
- [x] feedback/content/avatar attachment backfill is supported
- [x] `pnpm verify` run
