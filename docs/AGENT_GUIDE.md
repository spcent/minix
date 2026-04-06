# Agent Guide

This repository is structured to keep agent edits local, reversible, and easy to verify.

## Primary Rules

1. Core code and feature code must not call `wx.*` or `window.*` directly.
2. Platform-specific behavior belongs in platform packages only.
3. Services must return `Result<T>` instead of throwing for expected failures.
4. Do not widen `v0.1` scope by adding new top-level packages casually.
5. Prefer editing `packages/features/*` and host manifests before adding new abstractions.
6. Prefer `page-definitions.ts` as the host source of truth; do not hand-edit generated runtime or registry files.

## Where To Edit

### Shared behavior

Use [packages/core](packages/core) for:

- `src/ports/*`: adapter contracts for request, auth, router, storage, and UI
- `src/runtime/*`: app bootstrap plus auth/request/router/session orchestration
- `src/store/*`: cache, page models, and light state containers
- `src/error/*` and `src/types/*`: shared primitives

Use [packages/contracts](packages/contracts) for:

- route ids
- backend-facing request and response shapes
- shared cross-feature payload types

Use [packages/features](packages/features) for:

- feature controllers
- feature models
- reusable feature behavior
- feature-level defaults
- feature manifests and feature-owned page-data factories

### WeChat-specific behavior

Use [packages/platform-wechat/src/adapters](packages/platform-wechat/src/adapters) for:

- `wx.login`
- `wx.request`
- storage
- router
- toast/loading/modal

Use [packages/platform-wechat/src/bridge](packages/platform-wechat/src/bridge) for:

- `App()` registration
- `Page()` registration
- `setData` synchronization from controller store state

### Host-specific behavior

Use [apps/host-wechat/src/bootstrap](apps/host-wechat/src/bootstrap) for:

- environment config
- runtime composition
- mock backend integration

Use [apps/host-wechat/src/manifest](apps/host-wechat/src/manifest) for:

- `page-definitions.ts` as the editable host page source, using explicit definition builders from `@minix/core`
- host-specific overrides such as route shape, render mode, shell metadata, and UI policy
- generated `app.manifest.ts`, `page-manifest.ts`, and `page-config.ts` as derived outputs
- route mapping
- runtime-loadable typed page metadata that scripts and tooling can consume directly

Use [apps/host-wechat/src/registrations](apps/host-wechat/src/registrations) for:

- generated page registries
- thin wrappers that bind generated host wiring to feature packages
- importable registry metadata that tooling and guards can consume directly
- WeChat shell registration backed by `src/registrations/wechat/page-registry.ts`

Use [apps/host-wechat/miniprogram](apps/host-wechat/miniprogram) for:

- actual DevTools-scanned shell files
- `app.json`
- generated page `wxml/wxss/json`
- import-only shell `index.ts` files

### H5 host behavior

Use [apps/host-h5](apps/host-h5) for:

- browser-oriented host wiring
- manifest-driven route rendering
- render registry driven page resolution
- manifest-declared `renderMode` and exported renderer metadata
- H5 mock backend integration
- minimal DOM bootstrap shell

## Preferred Change Pattern

When adding behavior, prefer this order:

1. update or add a contract only if required
2. create a new feature package with `pnpm scaffold:feature <feature-name> [generic|list|detail|form|profile]` if one does not exist
3. scaffold placeholder host wiring with `pnpm scaffold:page <feature-name> <page-key>` when adding a new host page
4. implement or extend feature behavior and feature-owned defaults
5. add or update host source manifest overrides in `page-definitions.ts`
6. add or update a platform adapter or bridge
7. regenerate host registries or shell files through the existing sync commands instead of editing generated outputs
8. add tests
9. update docs if behavior or setup changed

`pnpm verify` enforces this by checking shared production code for direct platform calls, for `throw`-based failure paths outside the manifest assertion layer, for core service and adapter interfaces that drift away from `Promise<Result<...>>` or approved synchronous `Result<...>` query methods, for `contracts` code that tries to import runtime-only types from `@minix/core`, for `contracts` shapes that start declaring host/runtime configuration fields, for behavior-shaped contract types such as method signatures or function-typed members, for managed workspace packages that drift away from the canonical `src/index.ts` public entry, and for feature packages that try to widen their public surface beyond `src/index.ts`.

## What To Avoid

Avoid these unless the plan explicitly expands scope:

- new platform packages
- new global abstractions for features not used by the demo
- direct host API usage inside core, features, or shared page controllers
- cross-package deep imports such as `@minix/core/...`
- cross-package relative imports that bypass a package root export
- workspace source directories without both `package.json` and `src/index.ts`
- editing generated `app.manifest.ts`, `page-registry.ts`, or WeChat shell outputs by hand
- bypassing `page-registry.ts` and writing WeChat page logic directly in `miniprogram/pages/*`

## Validation Commands

Run from repo root:

```bash
pnpm verify
```

Useful scoped checks:

```bash
pnpm verify:feature <feature-name>
pnpm verify:host <host-name>
```

Use `pnpm typecheck` or `pnpm test` separately only when isolating a failure.

## Current Implementation Order

The repository has been built in this sequence:

1. core and workspace foundation
2. WeChat auth and host login
3. protected items flow and settings logout
4. runtime composition layer
5. WeChat app/page bridges
6. miniprogram shell
7. shell registration checks
8. mock backend and richer page shells
9. H5 minimal host flow
10. contracts/core/features host-manifest transition

That order matters. If a future change breaks one of these layers, fix the lower layer before adding more behavior on top.
