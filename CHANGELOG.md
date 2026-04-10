# Changelog

This file is the human-readable release note source of truth for MiniX.

Tracked package manifests and runtime version stamps now report `1.0.0` for the final `v1.0.0` release cut. Use the release record in [`docs/RELEASE_RUNBOOK.md`](/docs/RELEASE_RUNBOOK.md) together with this changelog to name final release notes.

## Unreleased

- no unreleased entries yet

## v1.0.0

Pending final tag.

Planned release shape:

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

Before tagging `v1.0.0`, update this section with the final release date, commit SHA, remote URLs, accepted deferred issues, and a concise summary of the shipped support surface.
