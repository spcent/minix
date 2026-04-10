# Card 0098 Auth Identity Upgrade Page Flow Completion

## Summary

Turn identity upgrade, phone binding, and account merge from controller/API operations into complete guided user flows.

## Goal

Provide dedicated route-backed workflows for guest upgrade, WeChat phone binding, merge preview, conflict confirmation, rollback-safe completion, and post-merge recovery.

## Milestone

- milestone file: none
- slice name: `auth identity upgrade page flow completion`

## Priority

- priority: `P0`

## Scope

- In scope:
  - add feature state and page data for guest upgrade, phone binding, merge preview, conflict confirmation, and completion states
  - add route ids and host manifest entries for identity workflow pages where needed
  - add merge preview output with source/target assets, relationships, content, messages, and feedback impact
  - add operation audit records and failure recovery messaging
  - add tests for merge required, conflict, confirmed merge, cancel, and rollback-safe failure
- Out of scope:
  - external OAuth provider binding, covered by `0113`

## Ownership

- owned files:
  - `packages/contracts/src/api/auth.ts`
  - `packages/contracts/src/routes.ts`
  - `packages/features/auth/src/**`
  - `packages/features/account/src/**`
  - `apps/api/src/app.ts`
  - `apps/host-h5/src/manifest/page-definitions.ts`
  - `apps/host-wechat/src/manifest/page-definitions.ts`
  - related tests
- allowed generated outputs:
  - regenerated manifests and shells only
- forbidden files:
  - handwritten edits to generated manifest or shell outputs

## Dependencies

- depends on:
  - `0083-auth-identity-upgrade-and-binding-workflows.md`
  - `0097-auth-real-provider-and-credential-productionization.md`
- blocked by:
  - none
- integration notes:
  - keep host wiring manifest-driven and avoid duplicate route maps

## Affected Paths

- `packages/contracts/src/api/auth.ts`
- `packages/contracts/src/routes.ts`
- `packages/features/auth/src/controller/index.ts`
- `packages/features/account/src/controller/index.ts`
- `apps/api/src/app.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for merge preview, audit summary, and rollback/failure reasons
- store shape changes allowed:
  - yes, for identity workflow state and operation history
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for workflow id, redirect target, and conflict state

## Verification

- slice gate:
  - each identity workflow has a user-visible start, confirm, success, failure, and recovery state
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat pages change
- final verifier handoff:
  - verify H5 and WeChat route registration parity

## Acceptance

- [ ] guest upgrade has a dedicated guided flow
- [ ] phone binding handles merge-required and already-bound cases
- [ ] account merge shows preview and requires explicit confirmation
- [ ] merge result includes asset/session/message/content impact summary
- [ ] host manifests expose the flows without generated-source edits
- [ ] `pnpm verify` run
