# AGENTS.md

This repository is optimized for small, verifiable edits. Keep changes local, keep boundaries explicit, and prefer the existing scaffolds over ad hoc structure.

## Product Scope

`v0.1` proves one shared flow across WeChat and H5:

`login -> /auth/login -> protected /items -> settings -> logout`

Do not expand scope casually. New top-level packages, new platform targets, or new global abstractions require a clear reason.

## Where To Edit

- `packages/contracts`: route ids and backend-facing contract types
- `packages/core`: shared ports, runtime orchestration, state, and base primitives
- `packages/features/*`: reusable feature behavior
- `packages/platform-wechat`: WeChat-specific adapters and bridge code
- `packages/platform-h5`: browser-specific adapters
- `packages/tooling`: scaffolding and repo automation scripts
- `apps/host-wechat`: WeChat host manifests, registrations, bootstrap, and generated shell
- `apps/host-h5`: H5 host manifests, render registry, and bootstrap

## Hard Rules

1. Shared code must not call `wx.*` or `window.*` directly.
2. Platform-specific behavior stays inside platform packages or host apps.
3. Expected failures should use `Result<T>` instead of thrown exceptions.
4. Respect package entry points. Do not add deep imports such as `@minix/core/...`.
5. Keep host wiring manifest- and registry-driven. Do not recreate parallel handwritten route maps.
6. Edit `apps/*/src/manifest/page-definitions.ts` as the host source of truth; do not hand-edit generated `app.manifest.ts`, `page-registry.ts`, or WeChat shell outputs.

## Feature Workspace Rules

- Keep `packages/features/*` as a workspace of small feature packages, not one large `packages/features` package.
- Prefer one feature package per business area such as `auth`, `items`, or `settings`.
- Feature packages should expose only `src/index.ts` and stay platform-agnostic.
- Shared cross-feature abstractions belong in `packages/core` or `packages/contracts`, not in a catch-all feature package.
- Use [`packages/features/README.md`](packages/features/README.md) as the local design rule for feature changes.

## Preferred Change Order

1. Update contracts only when the shared surface really changes.
2. Implement or extend feature logic in `packages/features/*`.
3. Adjust feature-owned defaults in `packages/features/*` before moving host-only values into app manifests.
4. Adjust platform adapters or bridges only where platform behavior differs.
5. Update host source manifests in `apps/*/src/manifest/page-definitions.ts`.
6. Regenerate host manifests or WeChat shell files instead of editing generated outputs.
7. Run validation from the repo root.
8. Update docs when behavior, setup, or workflow changes.

## Scaffolds

Use the existing scripts before creating files manually:

```bash
pnpm scaffold:feature <feature-name> [generic|auth|profile|list|detail|form|workspace]
pnpm scaffold:page <feature-name> <page-key>
pnpm gen:manifests
pnpm gen:shells
```

`scaffold:page` should be preferred after `scaffold:feature` because it can now reuse the feature's scaffold template, default page-data factory, and common controller route placeholders when present.
Use the `workspace` scaffold template as the default starter for upload/share capability features instead of introducing more template names too early.

## Validation

Run after code changes:

```bash
pnpm verify
```

For scoped verification use:

```bash
pnpm verify:feature <feature-name>
pnpm verify:host <host-name>
```

If you changed only documentation, explain that code validation was intentionally skipped.

## References

- [`README.md`](README.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/AGENT_GUIDE.md`](docs/AGENT_GUIDE.md)
- [`docs/BACKEND_CONTRACT.md`](docs/BACKEND_CONTRACT.md)
- [`packages/features/README.md`](packages/features/README.md)
