# Card 0214 Messages Host Adoption And Sync Hardening

## Summary

Close the gap between the implemented messages domain and the official host surfaces plus sync-mode clarity.

## Goal

Expose the shared inbox and conversation flows on the remaining official hosts and make the polling-based sync posture explicit and defensible.

## Milestone

- milestone file: none
- slice name: `messages host adoption and sync hardening`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add or align inbox/message entry points on official hosts that do not expose them
  - verify notification list, thread detail, read transitions, send, retry, and customer-service routes through those hosts
  - document and harden the current `polling` sync mode instead of implying real-time delivery
  - make sample touchpoint-provider behavior explicit where still used
- Out of scope:
  - implementing a new real-time transport unless the scope changes intentionally

## Ownership

- owned files:
  - `packages/contracts/src/api/message.ts`
  - `packages/features/messages/src/**`
  - `apps/api/src/domains/messages/**`
  - `apps/*/src/manifest/page-definitions.ts`
- allowed generated outputs:
  - generated manifests and WeChat shells if host source manifests change
- forbidden files:
  - direct host-local inbox implementations outside the shared messages feature

## Dependencies

- depends on:
  - `0213-settings-surface-parity.md`
- blocked by:
  - none
- integration notes:
  - notification and conversation surfaces must stay distinct in shared contracts and host UX

## Affected Paths

- `packages/contracts/src/api/message.ts`
- `packages/features/messages/src/controller/index.ts`
- `apps/api/src/domains/messages/routes.ts`
- `apps/api/src/domains/messages/touchpoints.ts`
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
  - yes, for sync-state and host-entry metadata
- store shape changes allowed:
  - yes, in messages state only
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for thread selection and route recovery

## Verification

- slice gate:
  - at least one additional official host exposes the shared inbox, and sync posture is documented as polling-first
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat pages change
- final verifier handoff:
  - record the host entry matrix and sync-mode contract

## Acceptance

- [x] official host coverage for inbox/messages is broader than `host-h5` only
- [x] polling-based sync behavior is explicit in code, tests, and docs
- [x] sample delivery-provider behavior is labeled clearly where it remains
- [x] boundaries still match specs
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run

## Execution Notes

- 2026-04-12: added shared `messages` route wiring to `apps/host-wechat/src/manifest/page-definitions.ts` and generated WeChat page shells
- 2026-04-12: exposed `onTapMarkVisibleRead` in the shared messages feature manifest so the new host shell stays feature-driven
- 2026-04-12: made polling-first sync labels explicit in `MessageSyncState`, API delivery labels, host H5 inbox rendering, WeChat inbox shell copy, and backend contract docs
