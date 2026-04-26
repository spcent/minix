# Card 0399 Host Bootstrap Env Normalization

## Summary

Normalize official host runtime env loading through one shared core bootstrap helper.

## Goal

Remove duplicated `__MINIX_BOOTSTRAP_ENV__`, process env, query param, and mock/default API URL resolution from official host bootstrap files while keeping H5 query overrides and WeChat process/env behavior explicit.

## Milestone

- milestone file: none
- slice name: `host bootstrap env normalization`

## Priority

- priority: `P2`

## Scope

- In scope:
  - shared `@minix/core` helper for host runtime env creation
  - refactor `host-h5`, `novel-h5`, `host-wechat`, and `novel-wechat` env loaders to use it
  - focused tests for the shared helper and unchanged host env behavior
- Out of scope:
  - changing official app IDs, app names, platform families, or default API URLs
  - generated manifest or shell edits

## Ownership

- owned files:
  - `packages/core/src/runtime/bootstrap-env.ts`
  - `packages/core/src/runtime/bootstrap-env.test.ts`
  - `apps/*/src/bootstrap/env.ts`
  - `apps/*/src/bootstrap/env.test.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests and registries

## Dependencies

- depends on:
  - `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
- blocked by:
  - none
- integration notes:
  - H5 keeps location query fallback; WeChat keeps process/env-only fallback.

## Affected Paths

- `packages/core/src/runtime/bootstrap-env.ts`
- `packages/core/src/runtime/bootstrap-env.test.ts`
- `apps/host-h5/src/bootstrap/env.ts`
- `apps/novel-h5/src/bootstrap/env.ts`
- `apps/host-wechat/src/bootstrap/env.ts`
- `apps/novel-wechat/src/bootstrap/env.ts`

## Related Specs

- `docs/ARCHITECTURE.md`
- `docs/PRODUCT_MATRIX_REUSE_PLAYBOOK.md`
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
  - `pnpm typecheck`
  - env-focused node tests
- generation needed:
  - none
- final verifier handoff:
  - include host env default, mock, override, and H5 query behavior.

## Implementation Notes

- Added `createBootstrapRuntimeEnv` and `readBootstrapEnvOverride` in `@minix/core`.
- Refactored all four official host env loaders to pass only app metadata, default/mock API URLs, version, platform, and H5 query support into the shared helper.
- Added core tests for mock default resolution, process-over-query precedence, and explicit override precedence.

## Verification Notes

- Ran `node --import tsx --test packages/core/src/runtime/bootstrap-env.test.ts apps/host-h5/src/bootstrap/env.test.ts apps/novel-h5/src/bootstrap/env.test.ts apps/host-wechat/src/bootstrap/env.test.ts apps/novel-wechat/src/bootstrap/env.test.ts`.
- Ran `pnpm typecheck`.

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
