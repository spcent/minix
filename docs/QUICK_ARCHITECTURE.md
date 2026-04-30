# MiniX Quick Architecture

This is the five-minute map for bounded changes in the current `v1.0.0` official sample surface.

## Mental Model

MiniX reuses business behavior, not UI rendering.

| Layer | Path | Owns |
| --- | --- | --- |
| contracts | `packages/contracts` | route ids, API request and response types, shared payloads |
| core | `packages/core` | runtime, ports, stores, page protocols, shared helpers |
| features | `packages/features/*` | platform-neutral controllers, models, feature manifests |
| platforms | `packages/platform-h5`, `packages/platform-wechat` | browser and WeChat adapters |
| hosts | `apps/host-*`, `apps/novel-*` | bootstrap, page manifests, page registrations, host render or shell code |
| sample API | `apps/api` | sample backend routes and domain workflows |

The official host surface is frozen to:

- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`

## Common Changes

### Change A Feature

Start in `packages/features/<feature-name>`. Keep workflow and state projection in the feature controller. Use `packages/core/src/page-protocols/*` for list, detail, and form lifecycle before adding feature-local flags.

Validate with:

```bash
pnpm verify:feature <feature-name>
```

### Add A Host-Visible Page

Prefer the scaffold:

```bash
pnpm scaffold:page <feature-name> <page-key>
pnpm gen:manifests
pnpm gen:shells
```

Editable host source is `apps/*/src/manifest/page-definitions.ts`. Do not hand-edit generated registries, app manifests, or WeChat shell output.

### Change A Shared API Shape

Use this order:

1. update `packages/contracts`
2. update `apps/api/src/domains/*`
3. update the owning `packages/features/*` controller or model
4. update host manifest data only if route-facing defaults changed
5. update docs when the contract or release posture changed

### Connect A Provider

Provider credentials, dashboards, callback domains, and WeChat validation are operator-owned. Repo-side behavior should fail closed in production mode when required provider inputs are missing.

Use:

- `docs/PRODUCTION_READINESS.md`
- `docs/RELEASE_RUNBOOK.md`
- authenticated `/ops/diagnostics`
- `MINIX_REMOTE_EVIDENCE_OUTPUT="<path>" pnpm verify:api:remote`
- `pnpm release:report -- --preview-evidence <path>`

### Change Host UI

Keep host UI changes in host render code or WeChat shell source. Shared controller state should stay platform-neutral.

Validate with:

```bash
pnpm verify:host <host-name>
```

## Do Not

- Do not call `window.*`, `wx.*`, or host globals from shared packages.
- Do not deep import across workspace packages.
- Do not add host-local wrappers around canonical contract outputs.
- Do not add new platform families during `v1.0.0` release closure.
- Do not move API domain logic into `apps/api/src/app.ts`.
- Do not mark provider rollout complete without evidence in `docs/VERIFICATION_LOG.md`.

## Full Gate

Run the full gate after code changes:

```bash
pnpm verify
```

For docs-only changes, record the intentional validation skip in the closeout.
