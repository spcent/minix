# Agent Guide

This file complements [`AGENTS.md`](../AGENTS.md). Keep it short, practical, and aligned with the current `v1.0.0` sample surface.

## Use This Order

1. Change shared contracts only if the shared surface changes.
2. Prefer feature/controller updates in `packages/features/*`.
3. Use `packages/core` for cross-feature runtime, page-protocol, or store primitives.
4. Use `apps/api/src/domains/*` for sample backend business behavior.
5. Touch platform packages only for true host differences.
6. Touch host manifests only in `apps/*/src/manifest/page-definitions.ts`.
7. Regenerate derived files instead of editing generated outputs.
8. Update docs when behavior or accepted exceptions change.

## Completion Checklist

Use this checklist when continuing feature or code completion work:

1. Confirm whether the domain already has a canonical output in [`docs/BACKEND_CONTRACT.md`](./BACKEND_CONTRACT.md).
2. Extend shared controller state before adding host-local wrappers or duplicate selectors.
3. Reuse shared list/detail/form protocols unless the domain is an explicit exception.
4. Keep provider-backed behavior explicit and production-safe; do not silently reuse sample fallbacks in production mode.
5. Record any intentional exception or remaining rollout gap in [`docs/DOMAIN_COMPLETENESS_MATRIX.md`](./DOMAIN_COMPLETENESS_MATRIX.md).
6. Add or update tests at the same layer where behavior changed.

## Where To Put Code

### Shared

- `packages/contracts`: request/response types and route ids
- `packages/core`: runtime orchestration, page protocols, store models, ports, and shared primitives
- `packages/features/*`: feature controllers, models, manifests, and feature-owned defaults

### Platform

- `packages/platform-h5`: browser adapters
- `packages/platform-wechat`: WeChat adapters and bridge code

### Hosts

- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`

Editable host source stays in `src/manifest/page-definitions.ts`.

### Sample API

- `apps/api/src/app.ts`: top-level app creation only
- `apps/api/src/app-composition*.ts`: route-group assembly and top-level wiring
- `apps/api/src/domains/*`: business domains

Prefer thin `routes.ts` entry files and split large domains into `routes.<concern>.ts` siblings.

## What To Avoid

- new top-level packages without a strong reason
- direct host API usage inside shared packages
- deep imports across workspace packages
- hand-editing generated host manifests, registries, or WeChat shell files
- rebuilding host-local wrappers around shared outputs when the contract can be normalized instead
- moving domain logic back into `apps/api/src/app.ts`
- hiding operator-owned rollout gaps inside sample-mode controller logic

## Completion Heuristics

- If the same behavior should appear on more than one official host, prefer shared controller or contract changes first.
- If only one host differs because of runtime capability, keep the difference in `packages/platform-*` or the host manifest.
- If a route returns a shape that another host or controller would also need, normalize the API envelope instead of adapting it in one caller.
- If a feature starts carrying route restore, detail status, or submit lifecycle by hand, stop and check whether an existing page protocol should own it.
- If a production rollout is not in-repo, keep the repo side explicit and document the remaining operator step instead of simulating completeness.

## Validation

Default:

```bash
pnpm verify
```

Targeted:

```bash
pnpm verify:feature <feature-name>
pnpm verify:host <host-name>
```

Use docs-only skips explicitly when no code changed.

## Common Sync Points

If a change affects behavior, release posture, or accepted exceptions, check:

- [`README.md`](../README.md)
- [`docs/BACKEND_CONTRACT.md`](./BACKEND_CONTRACT.md)
- [`docs/DOMAIN_COMPLETENESS_MATRIX.md`](./DOMAIN_COMPLETENESS_MATRIX.md)
- [`docs/PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md)
- [`docs/RELEASE_RUNBOOK.md`](./RELEASE_RUNBOOK.md)
- [`docs/VERIFICATION_LOG.md`](./VERIFICATION_LOG.md)
