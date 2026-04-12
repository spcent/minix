# Card 0105 User Relationship List And Social Graph

## Summary

Expand single-target relationship actions into full follow, fan, friend, blacklist, and remark list workflows.

## Goal

Provide list/detail/action coverage for user relationships rather than only account summary and one sample target.

## Milestone

- milestone file: none
- slice name: `user relationship list and social graph`

## Priority

- priority: `P1`

## Scope

- In scope:
  - add relation list contracts for following, followers, friends, blacklisted users, and remark targets
  - add pagination, filters, search, and relation action mutation behavior
  - add friend request or mutual confirmation state if friends are first-class
  - add notifications for follow/block/friend state changes
  - add account/user feature surfaces and tests
- Out of scope:
  - social recommendation ranking service

## Ownership

- owned files:
  - `packages/contracts/src/api/user.ts`
  - `packages/features/account/src/**`
  - optional user relationship feature package under `packages/features/*`
  - `apps/api/src/app.ts`
  - `apps/api/src/store*.ts`
  - host manifest page definitions if new pages are introduced
- allowed generated outputs:
  - regenerated manifests and shells only if pages change
- forbidden files:
  - generated host files as source edits

## Dependencies

- depends on:
  - `0088-account-operations-and-relationship-actions.md`
  - `0102-messaging-realtime-conversation-completion.md`
- blocked by:
  - none
- integration notes:
  - use common list contracts and avoid creating a catch-all feature package

## Affected Paths

- `packages/contracts/src/api/user.ts`
- `packages/features/account/src/controller/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for relation list, request, response, and friend-request state
- store shape changes allowed:
  - yes, for durable relation collections
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for relation type and target user id

## Verification

- slice gate:
  - each relationship category has list, empty, action, and mutation-refresh behavior
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat pages change
- final verifier handoff:
  - verify blocked users cannot be followed or messaged

## Acceptance

- [x] following/follower/friend/blacklist lists are implemented
- [x] remark names are editable from relationship surfaces
- [x] relation actions update list and account summary counts
- [x] friend or mutual relationship semantics are explicit
- [x] tests cover list pagination and mutation refresh
- [x] `pnpm verify` run
