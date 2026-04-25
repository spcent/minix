# MiniX v1.0.0

This is the tracked release-cut record. It does not replace the operator signoff evidence in [`VERIFICATION_LOG.md`](/docs/VERIFICATION_LOG.md); provider rollout, remote API proof, and manual WeChat validation are recorded there when executed.

## Release Name

- release name: `v1.0.0`
- git tag: not recorded in tracked source
- commit SHA: `d1c5232f0a6d63cfa585943ddd87353557c1c369`
- date: `2026-04-10`

## Summary

- This release cut freezes MiniX as a `v1.0.0` official-sample system across H5, WeChat, and the shared API.
- The core result is not a wider framework surface. It is a clearer, more defensible release boundary with stronger auth, payment, upload, messaging, content, search, account, settings, feedback, operational diagnostics, and release verification.

## Official Sample Surface

- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`
- `apps/api`

## Verification

- local gates passed:
  - `pnpm verify`
  - `pnpm verify:official-integrations`
  - `pnpm verify:h5:blackbox`
  - `pnpm verify:release`
- remote API URL verified: not recorded in tracked source
- preview H5 URLs verified:
  - `https://preview.minix-host-h5.pages.dev`
  - `https://preview.minix-novel-h5.pages.dev`
  - verification result not recorded in tracked source
- production H5 URLs verified:
  - `https://minix-host-h5.pages.dev`
  - `https://minix-novel-h5.pages.dev`
  - verification result not recorded in tracked source
- manual WeChat validation owner and date: not recorded in tracked source

## Upgrade And Operator Notes

- real Cloudflare ids, KV ids, and D1 ids must stay in the ignored `apps/api/wrangler.private.jsonc`
- real provider credentials and callback registrations are operator-owned and are not committed in tracked source
- WeChat request, upload, and download allowlists must be configured against the deployed API domain before preview or production validation
- payment production-mode callback verification requires `MINIX_PAYMENT_WEBHOOK_SECRET`
- capability support, provider setup, and accepted deferred issues are documented in [`docs/PRODUCTION_READINESS.md`](/docs/PRODUCTION_READINESS.md)

## Accepted Deferred Issues

- real SMS provider credentials are operator-owned and are not committed in tracked source
- real OAuth provider credentials and callback registrations are operator-owned and are not committed in tracked source
- no external object storage bucket binding is committed; upload lifecycle is release-backed through the sample backend surface
- payment callback verification is implemented, but live merchant credentials are operator-owned and are not committed in tracked source
- WeChat release proof still requires manual DevTools or device validation outside repository automation

## Links

- changelog entry: [`CHANGELOG.md`](/CHANGELOG.md)
- runbook: [`docs/RELEASE_RUNBOOK.md`](/docs/RELEASE_RUNBOOK.md)
- milestone: [`tasks/milestones/M001-v1.0-release-readiness.md`](/tasks/milestones/M001-v1.0-release-readiness.md)
- verification log: [`docs/VERIFICATION_LOG.md`](/docs/VERIFICATION_LOG.md)
