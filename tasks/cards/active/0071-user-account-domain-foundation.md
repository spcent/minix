# Card 0071 User Account Domain Foundation

## Summary

Introduce a real shared user/account domain so hosts can depend on stable `userProfile`, `accountSummary`, and `userStatus` outputs instead of the current minimal `/me` response.

## Goal

Create one reusable user domain contract and feature package that covers profile, account binding summary, account state, and reserved asset fields without leaking host-specific assumptions.

## Scope

- In scope:
  - add user/account contracts for `userProfile`, `accountSummary`, and `userStatus`
  - cover profile fields such as nickname, avatar, gender, region, bio, and tags
  - cover account fields such as user id, phone binding, WeChat binding, and real-name status
  - cover status fields such as enabled, frozen, cancellation in progress, blacklist, and guest state
  - reserve user-asset placeholders for points, level, membership,权益, and balance-like values
  - reserve relation placeholders for follow, fans, friends, blacklist, and remark-name views
  - widen API sample `/me` or add explicit user endpoints that return those shared outputs
  - upgrade `@minix/feature-account` from scaffold-level controller to official host-usable feature
  - add route ids and host manifest entries for account/profile surfaces where appropriate
- Out of scope:
  - social graph behavior such as follow, friend, or blacklist actions
  - full real-name verification workflows
  - real wallet or points ledgers

## Milestone

- milestone file: none
- slice name: `user account domain`

## Ownership

- owned files:
  - `packages/contracts/src/api/**`
  - `packages/contracts/src/routes/app.ts`
  - `packages/core/src/page-protocols/profile.ts`
  - `packages/features/account/src/**`
  - `apps/api/src/app.ts`
  - `apps/api/src/types.ts`
  - `apps/api/src/data.ts`
  - `apps/*/src/manifest/page-definitions.ts`
  - host source page entries needed for the new page
  - affected tests
- allowed generated outputs:
  - generated host manifests and shell files
- forbidden files:
  - handwritten edits to generated registry or shell outputs

## Dependencies

- depends on:
  - `0069-auth-identity-contract-hardening.md`
  - `0070-auth-route-enforcement-and-redirect-unification.md`
- blocked by:
  - none
- integration notes:
  - keep relationship and asset fields explicit placeholders rather than silently omitting them

## Affected Paths

- `packages/contracts/src/api/auth.ts`
- `packages/contracts/src/routes/app.ts`
- `packages/core/src/page-protocols/profile.ts`
- `packages/features/account/src/model/index.ts`
- `packages/features/account/src/controller/index.ts`
- `packages/features/account/src/feature.manifest.ts`
- `apps/api/src/app.ts`
- `apps/api/src/types.ts`
- `apps/api/src/data.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`
- optional `apps/novel-h5/src/manifest/page-definitions.ts`
- optional `apps/novel-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `README.md`
- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`
- `specs/repo.yaml`

## Interface Notes

- contract changes allowed:
  - yes, add explicit user/account response types and route ids
- store shape changes allowed:
  - yes, in `account` feature state
- controller action changes allowed:
  - yes, in `account` feature only
- route param changes allowed:
  - yes, only for account page entry and auth recovery context

## Verification

- slice gate:
  - at least one official host can render a shared account page backed by stable user/account contracts
- generation needed:
  - run `pnpm gen:manifests` and `pnpm gen:shells` after host source manifest updates
- final verifier handoff:
  - record final `userProfile`, `accountSummary`, and `userStatus` shapes
  - record which fields are sample-backed versus explicit placeholders for later backend work

## Acceptance

- [ ] user/account domain has explicit shared outputs instead of host-local `/me` parsing
- [ ] `@minix/feature-account` is adopted by at least one official host manifest
- [ ] reserved fields for phone binding, WeChat binding, real-name state, and asset placeholders are modeled explicitly
- [ ] reserved relation fields for follow/fans/friends/blacklist/remark name are modeled explicitly
- [ ] `pnpm verify` run
