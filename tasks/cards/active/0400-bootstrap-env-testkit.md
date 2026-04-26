# Card 0400 Bootstrap Env Testkit

## Summary

Move repeated host bootstrap global and location test scaffolding into `@minix/testkit`.

## Goal

Make official host env tests shorter and less fragile by reusing one test utility for `__MINIX_BOOTSTRAP_ENV__` overrides and browser query-string overrides.

## Milestone

- milestone file: none
- slice name: `bootstrap env testkit`

## Priority

- priority: `P3`

## Scope

- In scope:
  - reusable testkit helpers for bootstrap override and `globalThis.location.search`
  - adoption in official host env tests
  - targeted test/typecheck validation
- Out of scope:
  - production runtime behavior changes
  - new testing framework or broad test rewrites

## Ownership

- owned files:
  - `packages/testkit/src/index.ts`
  - `apps/*/src/bootstrap/env.test.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests and registries

## Dependencies

- depends on:
  - `tasks/cards/active/0399-host-bootstrap-env-normalization.md`
- blocked by:
  - none
- integration notes:
  - Keep helpers generic and test-only; production code must continue using `@minix/core`.

## Affected Paths

- `packages/testkit/src/index.ts`
- `apps/host-h5/src/bootstrap/env.test.ts`
- `apps/novel-h5/src/bootstrap/env.test.ts`
- `apps/host-wechat/src/bootstrap/env.test.ts`
- `apps/novel-wechat/src/bootstrap/env.test.ts`

## Related Specs

- `docs/modules/testkit.md`
- `specs/dependency-rules.yaml`

## Interface Notes

- contract changes allowed:
  - none
- store shape changes allowed:
  - none
- controller action changes allowed:
  - none
- route param changes allowed:
  - none

## Verification

- slice gate:
  - env-focused node tests
  - `pnpm typecheck`
- generation needed:
  - none
- final verifier handoff:
  - host env tests should not define local global override helpers.

## Implementation Notes

- Added `withBootstrapEnvOverride` and `withBootstrapLocationSearch` to `@minix/testkit`.
- Removed repeated local global override helpers from all official host env tests.
- Kept H5-only location query coverage explicit in H5 env tests.

## Verification Notes

- Ran `node --import tsx --test apps/host-h5/src/bootstrap/env.test.ts apps/novel-h5/src/bootstrap/env.test.ts apps/host-wechat/src/bootstrap/env.test.ts apps/novel-wechat/src/bootstrap/env.test.ts`.
- Ran `pnpm typecheck`.

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
