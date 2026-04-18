# MiniX

MiniX is a `v1.0.0` release-cut sample kernel for shared H5 and WeChat apps.

The repository is intentionally bounded. It supports four official sample apps plus one shared API:

- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`
- `apps/api`

MiniX is not a general-purpose cross-platform framework. The current goal is to keep shared contracts, runtime boundaries, host wiring, and release validation explicit and safe to change.

## Workspace

- `apps/api`: shared sample API and Worker entry
- `apps/host-h5`: official H5 sample for the shared flow
- `apps/host-wechat`: official WeChat sample for the shared flow
- `apps/novel-h5`: official H5 sample for the novel line
- `apps/novel-wechat`: official WeChat sample for the novel line
- `packages/contracts`: route ids and backend-facing contract types
- `packages/core`: shared runtime, ports, store, page protocols, capability abstractions
- `packages/features/*`: platform-agnostic business features
- `packages/platform-h5`: browser adapters
- `packages/platform-wechat`: WeChat adapters
- `packages/tooling`: scaffolding and repo automation
- `packages/testkit`: shared test helpers

## Current Product Surface

The shared sample surface includes:

- auth and identity flows
- account and settings
- items, discover, inbox, feedback, and media tools
- novel catalog, detail, reader, bookshelf, and membership
- shared payment, upload, share, feedback, and context envelopes

The current repo stance is:

- shared outputs are normalized by domain instead of host-local response shapes
- host wiring stays manifest-driven
- provider-backed areas fail closed in production mode unless real operators configure them
- messages remain explicitly polling-only

## Quick Start

Install dependencies:

```bash
pnpm install
```

Run the local API:

```bash
pnpm dev:api
```

Run the main H5 sample:

```bash
pnpm dev
```

Run the novel H5 sample:

```bash
pnpm dev:novel-h5
```

Useful local URLs:

- `http://localhost:4173` for `host-h5`
- `http://localhost:4174` for `novel-h5`
- `http://localhost:3000` for the local API

For WeChat, import `apps/host-wechat` or `apps/novel-wechat` into DevTools and keep `miniprogramRoot` set to `miniprogram/`.

## Verification

Run the full repo gate:

```bash
pnpm verify
```

Run scoped gates when needed:

```bash
pnpm verify:feature <feature-name>
pnpm verify:host <host-name>
```

Run integration and release-facing checks:

```bash
pnpm verify:official-integrations
pnpm verify:h5:blackbox
pnpm verify:release
pnpm smoke:official-samples
```

## Scaffolds

Use the existing scripts before creating structure manually:

```bash
pnpm scaffold:feature <feature-name> [generic|auth|profile|list|detail|form|workspace]
pnpm scaffold:page <feature-name> <page-key>
pnpm gen:manifests
pnpm gen:shells
```

`workspace` is the default starter for upload-style and share-style capability features.

## Release And Operations

This repository includes release and operator guidance, but real credentials, cloud ids, callback domains, and provider rollout remain outside tracked source.

Use these documents together:

- [`docs/BACKEND_CONTRACT.md`](docs/BACKEND_CONTRACT.md)
- [`docs/DOMAIN_COMPLETENESS_MATRIX.md`](docs/DOMAIN_COMPLETENESS_MATRIX.md)
- [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md)
- [`docs/RELEASE_RUNBOOK.md`](docs/RELEASE_RUNBOOK.md)
- [`docs/VERIFICATION_LOG.md`](docs/VERIFICATION_LOG.md)

## Change Rules

- Keep shared code free of `wx.*` and `window.*`.
- Keep platform behavior inside platform packages or host apps.
- Respect package entry points; do not add deep imports.
- Treat `apps/*/src/manifest/page-definitions.ts` as the host source of truth.
- Regenerate manifests and shells instead of editing generated files by hand.
