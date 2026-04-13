# Card 0224 Auth Provider Production Readiness

## Summary

Track the remaining auth-domain gap after host entry closure: provider-grade SMS and OAuth readiness plus an explicit recovery surface.

## Goal

Make auth provider posture and recovery handling complete enough that official hosts do not rely only on sample-mode login copy for SMS and OAuth flows.

## Milestone

- milestone file: none
- slice name: `auth provider production readiness`

## Priority

- priority: `P1`

## Scope

- In scope:
  - inventory the remaining provider-owned gaps in SMS verification and OAuth callback flows
  - define whether official hosts need a dedicated auth recovery or callback surface beyond the current login page
  - keep provider readiness explicit in contracts, controller state, and host copy
  - document operator-owned setup versus repo-owned behavior clearly
- Out of scope:
  - committing provider credentials or secrets

## Ownership

- owned files:
  - `packages/contracts/src/api/auth.ts`
  - `packages/features/auth/src/**`
  - `apps/api/src/domains/auth/**`
  - `apps/*/src/manifest/page-definitions.ts`
  - `docs/**`
- allowed generated outputs:
  - generated manifests and shells if host routes change
- forbidden files:
  - committed private credentials or callback secrets

## Dependencies

- depends on:
  - `tasks/cards/done/0211-login-host-and-provider-closure.md`
- blocked by:
  - none
- integration notes:
  - preserve the current host-specific default login posture and keep SMS/OAuth recovery on the bounded login or identity surfaces rather than adding a dedicated callback-only page

## Affected Paths

- `packages/contracts/src/api/auth.ts`
- `packages/features/auth/src/controller/index.ts`
- `packages/features/auth/src/model/index.ts`
- `apps/api/src/domains/auth/routes.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`
- `apps/novel-h5/src/manifest/page-definitions.ts`
- `apps/novel-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`

## Interface Notes

- contract changes allowed:
  - yes, for provider-readiness and recovery metadata
- store shape changes allowed:
  - yes, in auth state only
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, if a dedicated recovery route is added

## Verification

- slice gate:
  - official hosts can express auth provider readiness and recovery behavior without hidden sample-only assumptions
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat pages change
- final verifier handoff:
  - include SMS/OAuth provider-readiness matrix and callback/recovery route decision

## Acceptance

- [x] SMS verification posture is explicit and host-visible
- [x] OAuth callback and recovery posture is explicit and host-visible
- [x] any required auth recovery or callback surface is manifest-driven
- [x] docs distinguish repo-owned behavior from operator-owned provider setup
- [ ] `pnpm verify` run if code changes
