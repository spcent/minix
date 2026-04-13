# Card 0076 Upload Share Foundation

## Summary

Add explicit shared upload and share surfaces so capability enums stop being placeholders and can support real feature work later.

## Goal

Model `uploadTask`, `uploadAsset`, `uploadError`, `sharePayload`, `shareChannel`, and `shareAttribution` through contracts and feature packages while keeping platform media/file APIs behind adapters.

## Milestone

- milestone file: none
- slice name: `upload and share foundation`

## Scope

- In scope:
  - add contracts for `uploadTask`, `uploadAsset`, `uploadError`, `sharePayload`, `shareChannel`, and `shareAttribution`
  - cover upload file types such as image, audio, video, PDF, avatar, and generic attachment
  - cover upload flow stages such as file choose, compression, reserved chunking, progress, retry, and cancel
  - cover governance fields such as size limit, type limit, sensitive-content review, and expiry cleanup
  - cover upload result metadata such as final URL, thumbnail, cover image, and file metadata
  - cover share scenarios such as page share, content share, invite share, poster share, link copy, image poster, short link, and channel markers
  - cover share growth metadata such as invite binding, return-flow recognition, share count, click count, and conversion attribution
  - implement adapter-level capability support for upload and share reservations where possible
  - create one workspace-style feature package for upload/share orchestration if the surface is shared enough
  - adopt only a minimal host-visible entry point needed to prove the shared contract
- Out of scope:
  - real storage backends, CDN signing, or chunked upload production behavior
  - poster generation or growth analytics pipelines

## Ownership

- owned files:
  - `packages/contracts/src/api/**`
  - `packages/contracts/src/kernel/capability.ts`
  - `packages/platform-h5/src/adapters/capability.adapter.ts`
  - `packages/platform-wechat/src/adapters/capability.adapter.ts`
  - new or updated workspace-style feature package under `packages/features/*`
  - `apps/api/src/app.ts`
  - selected host source manifests
  - affected tests
- allowed generated outputs:
  - generated manifests and shells after host source changes
- forbidden files:
  - direct shared-code access to `wx.chooseMedia`, DOM file inputs, or browser share APIs

## Dependencies

- depends on:
  - `0071-user-account-domain-foundation.md`
- blocked by:
  - none
- integration notes:
  - prefer the existing `workspace` scaffold posture over introducing separate one-off feature shapes
  - preserve explicit platform differences between WeChat media selection and H5 file input while keeping one shared contract

## Affected Paths

- `packages/contracts/src/kernel/capability.ts`
- `packages/platform-h5/src/adapters/capability.adapter.ts`
- `packages/platform-wechat/src/adapters/capability.adapter.ts`
- selected `packages/contracts/src/api/**`
- selected `packages/features/*`
- optional `apps/api/src/app.ts`
- selected host `page-definitions.ts`

## Related Specs

- `README.md`
- `AGENTS.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, add upload and share contracts
- store shape changes allowed:
  - yes, in the upload/share feature only
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, only if a host page proves necessary

## Verification

- slice gate:
  - adapters expose explicit upload/share capability behavior and the feature package can exercise the shared contract without platform leakage
- generation needed:
  - run generation only if host manifests change
- final verifier handoff:
  - list implemented adapter actions versus reserved future actions
  - list which upload/share metrics are persisted versus contract placeholders

## Acceptance

- [x] upload and share are no longer capability enums with no shared domain model
- [x] platform-specific media/file APIs remain inside platform packages
- [x] upload contracts cover file type, process, governance, and result metadata explicitly
- [x] share contracts cover payload assembly, target channel, and attribution fields explicitly
- [x] any host-visible adoption uses manifest-driven wiring
- [x] `pnpm verify` run
