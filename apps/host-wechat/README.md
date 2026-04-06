# Host WeChat App

This app is the first MiniX runtime host for WeChat Mini Program.

## What It Proves

The host currently validates the first end-to-end MiniX path on WeChat:

`home -> wx.login -> /auth/login -> home (signed in) -> overview / protected /items / settings -> logout`

The app now targets `http://localhost:3000` by default so the shared flow validates against the local Hono API. A mock request adapter is still available, but it must be enabled explicitly.

## Structure

- `src/bootstrap/*`: env and mock adapters
- `src/manifest/*`: editable page definitions, derived host manifest, page manifest, and route mapping
- `src/registrations/*`: page registry and WeChat registration modules
- `miniprogram/*`: actual WeChat project shell scanned by DevTools

## Main Flow

The current host validates one path:

`home -> sign in -> home (unlocked nav) -> overview -> protected items -> settings -> logout`

## Open In WeChat DevTools

1. Open WeChat DevTools.
2. Import the project folder: `apps/host-wechat`.
3. Keep `miniprogramRoot` as `miniprogram/`.
4. Use the default `touristappid` for shell validation, or replace it with a real app id for real login testing.

The current project file is [project.config.json](apps/host-wechat/project.config.json).

## Private Release Config

For real release validation, create an ignored private config file next to the tracked project file:

```bash
cp apps/host-wechat/project.private.config.json.example apps/host-wechat/project.private.config.json
```

Then fill in:

- the real `appid` for the official `host-wechat` Mini Program
- any local-only DevTools preferences that should not be committed

WeChat release validation should treat [project.config.json](apps/host-wechat/project.config.json) as the public shell and `project.private.config.json` as the local private override.

## Local Validation

Run from the repo root:

```bash
pnpm verify
```

These cover:

- kernel auth, request, session, and storage behavior
- WeChat app/page bridge behavior
- miniprogram shell registration imports
- host mock backend responses

## Mock Backend Behavior

The host request layer no longer defaults to the mock adapter. To opt into the local mock backend explicitly, set `globalThis.__MINIX_BOOTSTRAP_ENV__ = { useMock: true }` before bootstrapping the runtime:

- env: [env.ts](apps/host-wechat/src/bootstrap/env.ts)
- manifest source: [page-definitions.ts](apps/host-wechat/src/manifest/page-definitions.ts)
- generated assembly: [app.manifest.ts](apps/host-wechat/src/manifest/app.manifest.ts)
- mock adapter: [mock-api.ts](apps/host-wechat/src/bootstrap/mock-api.ts)

Current mock routes:

- `POST /auth/login` returns a fixed host session
- `GET /items` requires `Authorization: Bearer mock-access-token`

List data is paged locally to exercise:

- protected requests
- load more
- unauthorized redirect back to login

## Switch Backend Targets

When validating against a different backend:

1. Override `apiBaseUrl` through `globalThis.__MINIX_BOOTSTRAP_ENV__ = { apiBaseUrl: "..." }`, or adjust the defaults in [env.ts](apps/host-wechat/src/bootstrap/env.ts).
2. Keep the backend contract aligned with [BACKEND_CONTRACT.md](docs/BACKEND_CONTRACT.md).
3. Replace `touristappid` in [project.config.json](apps/host-wechat/project.config.json) before validating real `wx.login` exchanges.

For release-side WeChat console setup, configure the HTTPS API domain for all required domain categories that the app uses:

- request合法域名
- uploadFile合法域名
- downloadFile合法域名

Use the final preview and production API HTTPS domains that will replace the local `http://localhost:3000` default.

## Notes

- `project.config.json` uses `touristappid` by default
- replace it with a real app id before testing real auth behavior
- keep the real app id out of tracked source by using `project.private.config.json`
- `src/manifest/page-manifest.ts` is the source of truth for WeChat route paths and miniprogram page order
- `src/manifest/page-manifest.ts` is a runtime-loadable typed data module, not a host-only wiring file
- `src/manifest/page-config.ts` owns host-configurable page state
- `src/manifest/page-definitions.ts` is the editable host page source and should use the definition builders from `@minix/core`
- `src/manifest/app.manifest.ts` is a generated runtime assembly file derived from `page-definitions.ts`
- `src/manifest/page-manifest.ts` also drives generated `app.json`, `pages/*/index.ts`, `pages/*/index.json`, `pages/*/index.wxml`, and `pages/*/index.wxss`
- `src/registrations/page-registry.ts` owns host page wiring and registry assembly primitives used by the manifest
- `src/registrations/wechat/page-registry.ts` owns WeChat shell registration and exports shell registry metadata
- `src/registrations/wechat/pages/*` are thin registration exports only
- `miniprogram/pages/*` only imports the runtime-backed page modules
