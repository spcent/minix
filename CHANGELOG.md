# Changelog

This file is the human-readable release note source of truth for MiniX.

Tracked package manifests and runtime version stamps now report `1.0.0` for the final `v1.0.0` release cut. Use the release record in [`docs/RELEASE_RUNBOOK.md`](/docs/RELEASE_RUNBOOK.md) together with this changelog to name final release notes.

## Unreleased

- no unreleased entries yet

## v1.0.0

Release-cut record from tracked repository evidence:

- release-cut commit: `d1c5232f0a6d63cfa585943ddd87353557c1c369`
- release-cut date: `2026-04-10`
- recorded by: `spcent <spcent@foxmail.com>`
- local verification evidence:
  - `pnpm verify`
  - `pnpm verify:official-integrations`
  - `pnpm verify:h5:blackbox`
  - `pnpm verify:release`

Shipped support surface:

- frozen official sample apps:
  - `apps/host-h5`
  - `apps/host-wechat`
  - `apps/novel-h5`
  - `apps/novel-wechat`
- local and remote API support via `apps/api`
- release gates:
  - `pnpm verify`
  - `pnpm verify:official-integrations`
  - `pnpm verify:h5:blackbox`
  - `pnpm verify:release`
- manual gate:
  - WeChat DevTools validation for both official Mini Program samples

Tracked release facts still unavailable in repository source:

- final git tag creation was not recorded in tracked source
- preview Worker URL was not recorded in tracked source
- production Worker URL was not recorded in tracked source
- manual WeChat validator identity, date, and result were not recorded in tracked source

Accepted deferred issues:

- real SMS provider credentials are operator-owned and are not committed in tracked source
- real OAuth provider credentials and callback registrations are operator-owned and are not committed in tracked source
- no external object storage bucket binding is committed; upload lifecycle is release-backed through the sample backend surface
- payment callback verification is implemented, but live merchant credentials are operator-owned and are not committed in tracked source
- WeChat release proof still requires manual DevTools or device validation outside repository automation
