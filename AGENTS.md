# AGENTS.md

MiniX is a small, manifest-driven multi-host workspace. Optimize for small, verifiable edits. Keep changes local, preserve package boundaries, and prefer existing scaffolds and shared contracts over ad hoc structure.

## Current Scope

The repository is on the frozen `v1.0.0` sample surface.

Official apps:

- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`

Do not casually widen scope with new platform families, new top-level packages, or broad new abstractions.

## Edit Map

- `packages/contracts`: route ids and backend-facing contract types
- `packages/core`: shared runtime, page protocols, store models, ports, and primitives
- `packages/features/*`: platform-agnostic feature behavior
- `packages/platform-h5`: browser-only adapters
- `packages/platform-wechat`: WeChat-only adapters and bridge code
- `packages/tooling`: scaffolds and repo automation
- `packages/testkit`: shared test helpers
- `apps/api`: sample API domains and route composition
- `apps/*/src/manifest/page-definitions.ts`: editable host page source of truth

## Hard Rules

1. Shared code must not call `wx.*`, `window.*`, or other host globals directly.
2. Platform-specific behavior stays in platform packages or host apps.
3. Expected failures use `Result<T>`; do not introduce throw-based control flow for normal business paths.
4. Respect package entry points. Do not add deep imports such as `@minix/core/...`.
5. Keep host wiring manifest-driven. Do not recreate handwritten route maps or page registries.
6. Do not hand-edit generated host files such as `app.manifest.ts`, `page-registry.ts`, or WeChat shell outputs.
7. Keep `apps/api/src/app.ts` and composition files thin; business logic belongs in `apps/api/src/domains/*`.

## Preferred Change Order

1. Update contracts only when the shared surface actually changes.
2. Implement or adjust shared behavior in `packages/features/*` or `packages/core`.
3. Update `apps/api/src/domains/*` when backend/sample behavior changes.
4. Adjust platform adapters only when host behavior truly differs.
5. Update host source manifests in `apps/*/src/manifest/page-definitions.ts`.
6. Regenerate manifests or shells instead of editing generated outputs.
7. Update docs when behavior, workflow, release posture, or accepted exceptions change.
8. Run validation from the repo root.

## Feature Completion Rules

When continuing an existing capability, prefer closing the whole shared slice instead of patching one host only.

1. Normalize business outputs to the canonical domain envelopes in `docs/BACKEND_CONTRACT.md`.
2. Reuse shared page protocols before inventing feature-local loading, detail, or form state.
3. Keep route restore, selection restore, and unauthorized-return behavior inside shared controllers when the behavior is cross-host.
4. Treat account and settings as summary workspaces; do not force them into fake list/detail shells.
5. Keep provider posture explicit. If a production path still depends on operator rollout, fail closed in production mode and document it.
6. When an intentional exception remains, record it in `docs/DOMAIN_COMPLETENESS_MATRIX.md` instead of hiding it in controller code or host copy.

## API And Controller Rules

- `packages/features/*` controllers should own normalized state, cross-host route synchronization, and action results.
- `apps/api/src/domains/*` should return shared envelopes and keep provider-specific metadata additive rather than replacing the base shape.
- Thin route entry files are preferred. Move shaping, persistence, and workflow logic into domain helpers when a route grows.
- Do not add host-specific copy or host-only fallback semantics to shared controllers unless every official host consumes the same behavior.
- Prefer extending existing envelopes such as `session`, `accountSummary`, `searchResults`, `uploadTask`, or `feedbackStatus` over adding sibling wrappers.

## Test Expectations

- Add or update controller tests when shared state, route restore, action lifecycle, or output projection changes.
- Add or update API tests when request or response envelopes, provider posture, or domain workflow behavior changes.
- Run `pnpm verify:feature <feature-name>` when a feature package changes.
- Run `pnpm verify` before closeout unless the change is docs-only.

## Scaffolds

Prefer existing scripts before creating files manually:

```bash
pnpm scaffold:feature <feature-name> [generic|auth|profile|list|detail|form|workspace]
pnpm scaffold:page <feature-name> <page-key>
pnpm gen:manifests
pnpm gen:shells
```

Notes:

- `scaffold:page` should usually follow `scaffold:feature`
- `workspace` is the default starter for upload/share-style capability features

## Validation

After code changes:

```bash
pnpm verify
```

Useful scoped checks:

```bash
pnpm verify:feature <feature-name>
pnpm verify:host <host-name>
```

If the change is docs-only, say that validation was intentionally skipped.

## Docs To Sync

When behavior or release posture changes, check whether these also need updates:

- `README.md`
- `docs/AGENT_GUIDE.md`
- `docs/BACKEND_CONTRACT.md`
- `docs/DOMAIN_COMPLETENESS_MATRIX.md`
- `docs/PRODUCTION_READINESS.md`
- `docs/RELEASE_RUNBOOK.md`
- `docs/VERIFICATION_LOG.md`
- `packages/features/README.md`
