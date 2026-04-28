# Card 0454 Host Runtime Kernel Testkit Adoption

## Summary

Move repeated official H5 runtime kernel test scaffolding behind reusable `@minix/testkit` helpers.

## Goal

Make host runtime tests clearer and easier to extend when additional product hosts reuse the same runtime controller contract.

## Milestone

- milestone file: none
- slice name: `host runtime kernel testkit adoption`

## Scope

- In scope:
  - strengthen `createBaseKernelStub` with realistic default ports
  - add small testkit options for app identity, session, request, auth, router, and UI overrides
  - adopt the helper in official H5 runtime tests while keeping domain-specific request fixtures local
- Out of scope:
  - production runtime behavior changes
  - WeChat shell or generated registry edits
  - fixture data redesign

## Ownership

- owned files:
  - `packages/testkit/src/index.ts`
  - `apps/host-h5/src/bootstrap/runtime.test.ts`
  - `apps/novel-h5/src/bootstrap/runtime.test.ts`
- allowed generated outputs:
  - none
- forbidden files:
  - generated host manifests and registries

## Dependencies

- depends on:
  - `tasks/cards/active/0453-shared-host-entry-behavior-helper.md`
- blocked by:
  - none
- integration notes:
  - Testkit helpers must stay test-only and must not introduce host globals.

## Affected Paths

- `packages/testkit/src/index.ts`
- `apps/host-h5/src/bootstrap/runtime.test.ts`
- `apps/novel-h5/src/bootstrap/runtime.test.ts`

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
  - `node --import tsx --test apps/host-h5/src/bootstrap/runtime.test.ts apps/novel-h5/src/bootstrap/runtime.test.ts`
  - `pnpm typecheck`
- generation needed:
  - none
- final verifier handoff:
  - Runtime tests should configure only host-specific request/session/auth/router behavior locally.

## Acceptance

## Implementation Notes

- Expanded `createBaseKernelStub` with default storage, request, auth, router, and UI ports plus typed override options.
- Migrated official H5 runtime tests to reuse the base kernel stub and keep only host/domain request fixtures local.
- Documented the helper in the testkit module guide.

## Verification Notes

- Ran `node --import tsx --test apps/host-h5/src/bootstrap/runtime.test.ts apps/novel-h5/src/bootstrap/runtime.test.ts`.
- Ran `pnpm typecheck`.

## Acceptance

- [x] change is local and reversible
- [x] write set matches ownership
- [x] boundaries still match specs
- [x] host wiring remains manifest- and registry-driven
- [x] generated files were regenerated, not manually authored as source
- [x] docs updated if behavior or workflow changed
- [x] `pnpm verify` run, or skipped with reason if docs-only
