# Card 0281 Upload Governance Expansion

## Summary

Expand upload storage metadata, review annotations, derived assets, retention, and cleanup reporting through the existing upload pipeline.

## Goal

Keep image, audio, video, PDF, avatar, and attachment upload behavior aligned on `uploadTask`, `uploadAsset`, and `uploadError` while preparing production providers.

## Milestone

- milestone file: none
- slice name: `upload governance expansion`

## Priority

- priority: `P2`

## Scope

- In scope:
  - production storage adapter metadata
  - malware or sensitive-content review annotations
  - derived thumbnail, cover, preview, and original asset summaries
  - retention and cleanup reports
- Out of scope:
  - direct host globals from shared packages
  - committed bucket secrets
  - replacing the media-tools workspace with host-specific upload pages

## Ownership

- owned files:
  - `packages/contracts/src/api/upload.ts`
  - `packages/features/media-tools`
  - `apps/api/src/domains/uploads`
  - `packages/platform-h5`
  - `packages/platform-wechat`
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- allowed generated outputs:
  - regenerated manifests or shells only if host source manifests change
- forbidden files:
  - storage secrets, review secrets, manual generated output edits

## Dependencies

- depends on:
  - `tasks/cards/active/0244-upload-provider-rollout-and-asset-host-cutover.md`
  - `tasks/cards/done/0264-upload-governance-and-derived-asset-metadata.md`
- blocked by:
  - selected object storage and review providers for provider-specific metadata
- integration notes:
  - platform-specific file picking remains in `packages/platform-*`

## Affected Paths

- `packages/contracts/src/api/upload.ts`
- `packages/features/media-tools`
- `apps/api/src/domains/uploads`
- `packages/platform-h5`
- `packages/platform-wechat`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - additive-only
- store shape changes allowed:
  - additive-only in media-tools state
- controller action changes allowed:
  - yes, for existing upload, retry, cancel, attach, and status flows
- route param changes allowed:
  - additive-only within existing upload routes

## Verification

- slice gate:
  - `pnpm verify:feature media-tools`
- generation needed:
  - none unless host manifests change
- final verifier handoff:
  - include upload, session, chunk, complete, attach, retry, cancel, asset, thumbnail, review, and cleanup examples

## Implementation Notes

- Added `UploadProviderPosture` to the upload response contract with storage provider, review provider, asset host, provider mode, and explicit secret-material posture.
- Derived provider posture in the upload API pipeline from existing review/storage metadata and exposed it without adding or tracking secrets.
- Surfaced provider posture in media-tools state while preserving canonical `uploadTask`, `uploadAsset`, and `uploadError` outputs.
- Updated `docs/DOMAIN_COMPLETENESS_MATRIX.md` to record the upload provider posture and governance expansion.

## Verification Notes

- Ran `pnpm verify:feature media-tools`.
- Ran `pnpm test`.

## Acceptance

- [x] upload outputs remain `uploadTask`, `uploadAsset`, and `uploadError`
- [x] platform-specific behavior stays in platform packages
- [x] production provider metadata stays explicit without secrets in source
- [x] retention and derived asset behavior is documented
- [x] docs updated for provider or governance changes
- [x] `pnpm verify` run, or skipped with reason if docs-only
