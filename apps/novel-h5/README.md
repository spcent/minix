# Novel H5 App

This app is the standalone H5 shell for the novel product line.

The host now runs a complete local novel flow against the local Hono API at `http://localhost:3000` by default, with a mock path still available for isolated demo validation.

## Release Boundary

The novel hosts are part of the frozen `v1.0` official sample surface, but several richer behaviors remain sample-local rather than shared MiniX kernel promises.

- sample-local for `v1.0`: bookshelf orchestration, storefront recommendation lanes, membership purchase and return flows, reader continuity cues, and reading-center posture copy
- candidate post-`v1.0` extractions: any access or continuity primitive that becomes necessary outside the novel sample line

## Run It

From the repo root:

```bash
pnpm dev:novel-h5
```

The local preview runs on `http://localhost:4174`.

## Cloudflare Pages

The official remote Pages project name is `minix-novel-h5`.

URL convention:

- preview: `https://preview.minix-novel-h5.pages.dev`
- production: `https://minix-novel-h5.pages.dev`

Deploy commands from the repo root:

```bash
MINIX_API_BASE_URL="https://<preview-worker>.workers.dev" pnpm pages:deploy:novel-h5:preview
MINIX_API_BASE_URL="https://<production-worker>.workers.dev" pnpm pages:deploy:novel-h5:production
```

Deep-link fallback:

- the host ships `public/_redirects` with `/* /index.html 200`
- this keeps Cloudflare Pages refreshes and direct links to routes like `/catalog`, `/reader`, and `/membership` inside the SPA instead of returning a static 404

Release headers and cache policy:

- the host ships `public/_headers` for the Pages deploy
- `index.html` is served with `Cache-Control: no-cache, no-store, must-revalidate`
- `/assets/*` is currently served with `Cache-Control: no-cache` because the bundle file names are still stable rather than fingerprinted
- release headers include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and a narrow `Permissions-Policy`
- a strict CSP is intentionally not set yet because the current Pages build injects a small inline bootstrap script for `apiBaseUrl`

## Notes

- `src/manifest/page-definitions.ts` is the editable host source
- generated manifest files are derived from the host source and should not be edited by hand
- current route set includes `home`, `login`, `catalog`, `novelDetail`, `toc`, `reader`, `bookshelf`, `settings`, and `membership`
- add `?minix_use_mock=1` to the preview URL to force the local mock adapter
- set `window.__MINIX_BOOTSTRAP_ENV__ = { apiBaseUrl: "...", useMock: true }` before bootstrap if you need an explicit runtime override
- Pages deploys inject `window.__MINIX_BOOTSTRAP_ENV__.apiBaseUrl` into the built `index.html`, so the remote host does not fall back to `localhost:3000`
- the local mock adapter still covers login, catalog listing, novel detail, chapter TOC, chapter content, reading progress, bookshelf mutations, and membership purchase/unlock return flows
- `home` and `catalog` now expose shared recommendation lanes such as resume-first, recent updates, frontlist anchors, and quiet membership merchandising
- `settings` acts as a reading center, with stored display defaults, night-mode defaults, reminder posture, and reading-continuity preferences that flow back into reader and bookshelf behavior
- `reader` persists display preferences, keeps long-session continuity cues, and syncs active chapter highlighting plus current-volume recovery into the TOC
- `bookshelf` supports add/remove, grouped active or completed lanes, sorting, filtering, and pinning a focused title
- `detail` reads like a fuller title dossier, including reputation signals, update history, access explanation, author framing, and related-title programming
- membership purchase is mock-backed and can unlock premium titles before returning to the blocked detail or reader context
- these richer novel surfaces are official samples for `v1.0`, but they should not be read as guaranteed core MiniX abstractions outside the sample line
