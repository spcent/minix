# AGENTS.md

MiniX is a small manifest-driven multi-host workspace. Make small, verifiable edits, preserve package boundaries, and prefer existing contracts, controllers, manifests, and scaffolds over new ad hoc structure.

For expanded guidance, see `docs/AGENT_GUIDE.md`.

## Scope

The current surface is frozen at `v1.0.0`. Official apps are:

- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`

Do not add new platform families, top-level packages, or broad abstractions unless the task explicitly requires it.

## Edit Map

- `packages/contracts`: route ids and backend-facing request/response types
- `packages/core`: shared runtime, page protocols, stores, ports, and primitives
- `packages/features/*`: platform-agnostic feature controllers, state, models, and defaults
- `packages/platform-h5`: browser-only adapters
- `packages/platform-wechat`: WeChat-only adapters and bridge code
- `packages/tooling`: scaffolds and repo automation
- `packages/testkit`: shared test helpers
- `apps/api/src/domains/*`: sample API business logic
- `apps/*/src/manifest/page-definitions.ts`: editable host page source of truth

Keep `apps/api/src/app.ts` and composition files thin. Move domain shaping, persistence, and workflow logic into `apps/api/src/domains/*`.

## Non-Negotiables

- Shared packages must not call `wx.*`, `window.*`, or other host globals directly.
- Platform-specific behavior belongs in `packages/platform-*` or host apps.
- Expected failures use `Result<T>`; do not use throws for normal business paths.
- Import through package entry points only; do not add deep imports like `@minix/core/...`.
- Host wiring stays manifest-driven; do not recreate route maps or page registries by hand.
- Do not hand-edit generated files such as `app.manifest.ts`, `page-registry.ts`, or WeChat shell outputs.

## Change Strategy

1. Change contracts only when the shared surface changes.
2. Put cross-host behavior in `packages/features/*` or `packages/core` before patching a single host.
3. Keep host-specific runtime differences in platform packages or host manifests.
4. Normalize API outputs to the envelopes in `docs/BACKEND_CONTRACT.md` instead of adding caller-local wrappers.
5. Reuse shared page protocols for loading, list/detail/form state, route restore, and action lifecycle.
6. Keep production provider gaps explicit: fail closed where required and document intentional exceptions in `docs/DOMAIN_COMPLETENESS_MATRIX.md`.
7. Regenerate derived manifests or shells instead of editing generated output.
8. Update docs when behavior, workflow, release posture, or accepted exceptions change.

## Scaffolds

Prefer repo scripts before creating repetitive files manually:

```bash
pnpm scaffold:feature <feature-name> [generic|auth|profile|list|detail|form|workspace]
pnpm scaffold:page <feature-name> <page-key>
pnpm gen:manifests
pnpm gen:shells
```

Use `workspace` for upload/share-style capability features unless another starter fits better.

## Tests And Validation

- Add or update controller tests when shared state, route restore, action lifecycle, or projections change.
- Add or update API tests when request/response envelopes, provider posture, or domain workflows change.
- Run targeted checks while iterating, then `pnpm verify` before closeout for code changes.

```bash
pnpm verify:feature <feature-name>
pnpm verify:host <host-name>
pnpm verify
```

For docs-only changes, skip validation intentionally and say so in the closeout.
