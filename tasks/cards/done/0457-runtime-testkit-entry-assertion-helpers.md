# Card 0457 Runtime Testkit Entry Assertion Helpers

## Summary

Add reusable runtime registry and page-entry assertion helpers to `@minix/testkit`.

## Goal

Reduce repeated runtime test scaffolding across official hosts and make future product-host runtime tests easier to author consistently.

## Milestone

- milestone file: none
- slice name: `runtime testkit entry assertion helpers`

## Scope

- In scope:
  - add testkit helpers for asserting runtime registry/page keys and invoking entry actions
  - adopt the helpers in official runtime tests
  - run targeted runtime tests and typecheck
- Out of scope:
  - production runtime behavior changes
  - route, manifest, or generated file changes
  - broad fixture data redesign

## Ownership

- owned files:
  - `packages/testkit/src/index.ts`
  - `apps/*/src/bootstrap/runtime.test.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests and WeChat shell outputs

## Dependencies

- depends on:
  - `tasks/cards/done/0454-host-runtime-kernel-testkit-adoption.md`
  - `tasks/cards/done/0456-wechat-runtime-kernel-testkit-adoption.md`
- blocked by:
  - none
- integration notes:
  - Helpers must stay generic and test-only; host-specific fixture data remains local.

## Affected Paths

- `packages/testkit/src/index.ts`
- `apps/host-h5/src/bootstrap/runtime.test.ts`
- `apps/host-wechat/src/bootstrap/runtime.test.ts`
- `apps/novel-h5/src/bootstrap/runtime.test.ts`
- `apps/novel-wechat/src/bootstrap/runtime.test.ts`

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
  - `node --import tsx --test apps/host-h5/src/bootstrap/runtime.test.ts apps/host-wechat/src/bootstrap/runtime.test.ts apps/novel-h5/src/bootstrap/runtime.test.ts apps/novel-wechat/src/bootstrap/runtime.test.ts`
  - `pnpm typecheck`
- generation needed:
  - none
- final verifier handoff:
  - Runtime tests should use testkit helpers for registry/page key parity and dynamic entry action invocation.

## Acceptance

## Implementation Notes

- Added `assertRuntimePageKeys` for registry/page key parity checks.
- Added `invokeTestEntryAction` for dynamic entry-action smoke tests.
- Adopted both helpers across official runtime tests where applicable.
- Documented the helpers in the testkit module guide.

## Verification Notes

- Ran `node --import tsx --test apps/host-h5/src/bootstrap/runtime.test.ts apps/host-wechat/src/bootstrap/runtime.test.ts apps/novel-h5/src/bootstrap/runtime.test.ts apps/novel-wechat/src/bootstrap/runtime.test.ts`.
- Ran `pnpm typecheck`.

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
