# Changelog

This file is the human-readable release note source of truth for MiniX.

Until the final `v1.0.0` release commit is cut, the repository may still carry `0.1.0` metadata in tracked package manifests and runtime version stamps. Do not read that as a conflicting release promise. During release-candidate work, use the release record in [`docs/RELEASE_RUNBOOK.md`](/docs/RELEASE_RUNBOOK.md) together with this changelog to name RCs and final release notes.

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
