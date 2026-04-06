# Novel WeChat App

This app is the standalone WeChat Mini Program shell for the novel product line.

The Mini Program host now mirrors the same novel flow as H5 through generated WeChat shells and shared feature controllers, and it targets the local Hono API at `http://localhost:3000` by default.

## Release Boundary

The novel hosts are part of the frozen `v1.0` official sample surface, but several richer behaviors remain sample-local rather than shared MiniX kernel promises.

- sample-local for `v1.0`: bookshelf orchestration, storefront recommendation lanes, membership purchase and return flows, reader continuity cues, and reading-center posture copy
- candidate post-`v1.0` extractions: any access or continuity primitive that becomes necessary outside the novel sample line

## Open In WeChat DevTools

1. Open WeChat DevTools.
2. Import `apps/novel-wechat`.
3. Keep `miniprogramRoot` as `miniprogram/`.
4. Use the default `touristappid` until a real novel app id is available.

## Private Release Config

For real release validation, create an ignored private config file next to the tracked project file:

```bash
cp apps/novel-wechat/project.private.config.json.example apps/novel-wechat/project.private.config.json
```

Then fill in:

- the real `appid` for the official `novel-wechat` Mini Program
- any local-only DevTools preferences that should not be committed

WeChat release validation should treat [project.config.json](apps/novel-wechat/project.config.json) as the public shell and `project.private.config.json` as the local private override.

For release-side WeChat console setup, configure the HTTPS API domain for all required domain categories that the app uses:

- request合法域名
- uploadFile合法域名
- downloadFile合法域名

## Notes

- generated shell files under `miniprogram/pages/*` are derived from `src/manifest/page-definitions.ts`
- `src/registrations/wechat/pages/*` stay as thin registration modules
- current route set includes `login`, `catalog`, `novelDetail`, `toc`, `reader`, `bookshelf`, `settings`, and `membership`
- set `globalThis.__MINIX_BOOTSTRAP_ENV__ = { useMock: true }` before bootstrap if you want the local mock adapter instead of the local API
- set `globalThis.__MINIX_BOOTSTRAP_ENV__ = { apiBaseUrl: "..." }` before bootstrap if you need to point at a different backend
- `catalog`, `bookshelf`, and `settings` now expose card-level actions instead of acting as static shells
- `reader`, `toc`, and `detail` consume shared novel feature state for chapter continuity, membership intercepts, completion flows, and stronger title-dossier copy
- `toc` keeps current volume and current chapter recovery visible, including a direct jump-back path during longer reading sessions
- `settings` acts as a reading center for display defaults, night-mode posture, continuity controls, reminders, digest posture, and account state
- these richer novel surfaces are official samples for `v1.0`, but they should not be read as guaranteed core MiniX abstractions outside the sample line
- keep the real app id out of tracked source by using `project.private.config.json`
