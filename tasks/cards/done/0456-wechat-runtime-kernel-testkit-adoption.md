# Card 0456 WeChat Runtime Kernel Testkit Adoption

## Summary

Adopt the reusable base kernel test helper in official WeChat runtime tests.

## Goal

Keep H5 and WeChat runtime tests aligned around the same testkit kernel contract, so future product hosts can reuse the runtime test pattern without copying full kernel stubs.

## Milestone

- milestone file: none
- slice name: `wechat runtime kernel testkit adoption`

## Scope

- In scope:
  - use `createBaseKernelStub` in `host-wechat` and `novel-wechat` runtime tests
  - keep domain-specific request fixtures and route-location behavior local
  - run targeted runtime tests and typecheck
- Out of scope:
  - production runtime behavior changes
  - generated WeChat shell edits
  - fixture data redesign

## Ownership

- owned files:
  - `apps/host-wechat/src/bootstrap/runtime.test.ts`
  - `apps/novel-wechat/src/bootstrap/runtime.test.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests and WeChat shell outputs

## Dependencies

- depends on:
  - `tasks/cards/done/0454-host-runtime-kernel-testkit-adoption.md`
- blocked by:
  - none
- integration notes:
  - Keep platform-specific route current-location behavior in the WeChat tests.

## Affected Paths

- `apps/host-wechat/src/bootstrap/runtime.test.ts`
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
  - `node --import tsx --test apps/host-wechat/src/bootstrap/runtime.test.ts apps/novel-wechat/src/bootstrap/runtime.test.ts`
  - `pnpm typecheck`
- generation needed:
  - none
- final verifier handoff:
  - WeChat runtime tests should configure only host-specific request/auth/router behavior locally.

## Acceptance

## Implementation Notes

- Migrated `host-wechat` and `novel-wechat` runtime tests to `createBaseKernelStub`.
- Kept WeChat-specific request fixtures, authenticated session behavior, and current-location route updates local.

## Verification Notes

- Ran `node --import tsx --test apps/host-wechat/src/bootstrap/runtime.test.ts apps/novel-wechat/src/bootstrap/runtime.test.ts`.
- Ran `pnpm typecheck`.

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
