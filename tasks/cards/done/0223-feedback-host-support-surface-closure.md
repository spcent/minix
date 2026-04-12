# Card 0223 Feedback Host Support Surface Closure

## Summary

Promote the implemented feedback domain from an H5-only official host entry into a broader official support surface.

## Goal

Expose feedback intake, status, FAQ, and bounded support-entry behavior intentionally on the remaining official hosts.

## Milestone

- milestone file: none
- slice name: `feedback host support surface closure`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add or align feedback/support entry points on official hosts that do not currently expose them
  - verify feedback submission, ticket status, FAQ, revisit, and support-entry routing through those hosts
  - preserve upload-backed attachments and message-thread support integration
- Out of scope:
  - introducing a separate support product outside the existing feedback/message contracts

## Ownership

- owned files:
  - `packages/contracts/src/api/feedback.ts`
  - `packages/features/feedback/src/**`
  - `packages/features/messages/src/**`
  - `apps/api/src/domains/feedback/**`
  - `apps/*/src/manifest/page-definitions.ts`
- allowed generated outputs:
  - generated manifests and WeChat shells if host source manifests change
- forbidden files:
  - host-local feedback state models that bypass the shared feature

## Dependencies

- depends on:
  - `0222-share-host-and-provider-closure.md`
- blocked by:
  - none
- integration notes:
  - keep feedback as the source of truth for support-ticket state even when routing into messages

## Affected Paths

- `packages/contracts/src/api/feedback.ts`
- `packages/features/feedback/src/controller/index.ts`
- `packages/features/messages/src/controller/index.ts`
- `apps/api/src/domains/feedback/routes.ts`
- `apps/api/src/domains/feedback/support.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for host-entry metadata if needed
- store shape changes allowed:
  - yes, in feedback state only
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for ticket selection and support-entry routing

## Verification

- slice gate:
  - at least one additional official host exposes the shared feedback/support surface
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat pages change
- final verifier handoff:
  - record host entry matrix and support-loop routing matrix

## Acceptance

- [x] feedback/support entry is broader than `host-h5` only
- [x] ticket status, FAQ, revisit, and support-entry routing remain shared and testable
- [x] host wiring remains manifest- and registry-driven
- [x] boundaries still match specs
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run

## Execution Notes

- 2026-04-12: added shared `feedback` route wiring to `apps/host-wechat/src/manifest/page-definitions.ts` and generated the matching WeChat shell
- 2026-04-12: exposed refresh, FAQ, support-entry, and settings actions from the shared feedback feature manifest
- 2026-04-12: verified with `pnpm verify`
