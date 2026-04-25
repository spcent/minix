# Card 0271 Login Capability Expansion

## Summary

Extend the existing login and identity surface with richer provider, risk, recovery, and audit posture without changing the frozen v1 route family.

## Goal

Keep WeChat code, phone verification, password, guest, and reserved OAuth login flows inside the current auth contracts while making future risk and provider expansion explicit.

## Milestone

- milestone file: none
- slice name: `login capability expansion`

## Priority

- priority: `P2`

## Scope

- In scope:
  - richer risk rules and abnormal-login summaries
  - additional provider descriptors and operator-owned rollout metadata
  - stronger credential recovery summaries for phone, password, and OAuth paths
  - additive audit event scopes for login, verification, identity upgrade, bind, and merge flows
- Out of scope:
  - a second auth controller or token lifecycle
  - host-local token stores
  - committed SMS or OAuth credentials

## Ownership

- owned files:
  - `packages/contracts/src/api/auth.ts`
  - `packages/features/auth`
  - `apps/api/src/domains/auth`
  - `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- allowed generated outputs:
  - regenerated manifests or shells only if host source manifests change
- forbidden files:
  - provider secrets, callback private ids, or handwritten generated outputs

## Dependencies

- depends on:
  - `tasks/cards/active/0241-auth-provider-operator-rollout.md`
  - `tasks/cards/done/0259-auth-risk-and-identity-governance-hardening.md`
- blocked by:
  - chosen production SMS and OAuth providers for provider-specific fields
- integration notes:
  - keep provider execution operator-owned and keep shared outputs as `session`, `identity`, `authStatus`, and `redirectTarget`

## Affected Paths

- `packages/contracts/src/api/auth.ts`
- `packages/features/auth`
- `apps/api/src/domains/auth`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `docs/PRODUCTION_READINESS.md`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - additive-only
- store shape changes allowed:
  - additive-only
- controller action changes allowed:
  - only for existing login and identity pages
- route param changes allowed:
  - additive-only within existing auth route ids

## Verification

- slice gate:
  - `pnpm verify:feature auth`
- generation needed:
  - `pnpm gen:manifests` and `pnpm gen:shells` only if host manifests change
- final verifier handoff:
  - include auth response examples for login, refresh, logout, recovery, guest upgrade, phone bind, and merge

## Acceptance

- [ ] login expansion remains additive to `AuthSessionPayload`, `AuthIdentity`, and redirect contracts
- [ ] provider posture remains explicit and operator-owned
- [ ] no shared package calls host globals directly
- [ ] auth routes continue to fail closed when production providers are not configured
- [ ] docs and matrix notes are updated for any accepted exception
- [ ] `pnpm verify` run, or skipped with reason if docs-only
