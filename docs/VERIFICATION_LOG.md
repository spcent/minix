# MiniX Verification Log

This file is the tracked evidence ledger for release verification.

Use it together with:

- [`../CHANGELOG.md`](../CHANGELOG.md)
- [`./RELEASE_RUNBOOK.md`](./RELEASE_RUNBOOK.md)
- [`./PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md)

## How To Use

- Add one section per RC or final release.
- Record actual values once a step is executed.
- Write `pending` explicitly when an operator-owned step has not been completed yet.
- Keep provider rollout evidence separated by area instead of merging it into one generic note.

## Required Fields

Each release record should capture:

- release name
- commit SHA
- verification date
- operator or validator
- local gate results
- remote verification results when applicable
- manual WeChat validation owner, target, date, and result
- auth, message, payment, upload, and share rollout evidence
- final signoff owner and decision
- accepted deferred issues

## Template

### v1.0.0-rc.N

- status: pending
- commit SHA:
- verification date:
- operator:

#### Local Gates

- `pnpm verify`:
- `pnpm verify:official-integrations`:
- `pnpm verify:h5:blackbox`:
- `pnpm verify:release`:

#### Provider Rollout

- auth:
  - provider-readiness summary:
  - target env confirmation:
  - provider or callback evidence:
  - manual validation note:
- messages:
  - provider-readiness summary:
  - target env confirmation:
  - provider ownership evidence:
  - polling-only acceptance note:
- payment:
  - provider-readiness summary:
  - target env confirmation:
  - merchant or callback evidence:
  - purchase or refund validation note:
- upload:
  - provider-readiness summary:
  - target env confirmation:
  - storage or review evidence:
  - asset-host validation note:
- share:
  - provider-readiness summary:
  - target env confirmation:
  - short-link or poster evidence:
  - attribution validation note:

#### Remote Verification

- preview Worker URL:
- `pnpm verify:api:remote`:
- preview evidence pack path:
- preview rendered evidence snippet:
- preview `/ops/diagnostics` provider-readiness:
- preview `host-h5` URL:
- preview `novel-h5` URL:
- `pnpm verify:preview:remote`:
- production Worker URL:
- production `pnpm verify:api:remote`:
- production evidence pack path:
- production rendered evidence snippet:
- production `/ops/diagnostics` provider-readiness:
- production `host-h5` URL:
- production `novel-h5` URL:
- drift comparison (`local -> preview -> production`):

#### Manual WeChat Gate

- validator:
- date:
- target environment:
- `host-wechat`:
- `novel-wechat`:
- notes:

#### Release Signoff

- owner:
- decision:
- blockers:

#### Accepted Deferred Issues

- none recorded yet

## Current Tracked Final Record

### v1.0.0

- status: release-cut evidence partially recorded in tracked source
- commit SHA: `d1c5232f0a6d63cfa585943ddd87353557c1c369`
- verification date: `2026-04-10`
- operator: `spcent <spcent@foxmail.com>`

#### Local Gates

- `pnpm verify`: passed
- `pnpm verify:official-integrations`: passed
- `pnpm verify:h5:blackbox`: passed
- `pnpm verify:release`: passed

#### Provider Rollout

- auth: not recorded in tracked source
- messages: not recorded in tracked source
- payment: not recorded in tracked source
- upload: not recorded in tracked source
- share: not recorded in tracked source

#### Remote Verification

- preview Worker URL: not recorded in tracked source
- `pnpm verify:api:remote`: not recorded in tracked source
- preview evidence pack path: not recorded in tracked source
- preview rendered evidence snippet: not recorded in tracked source
- preview `host-h5` URL: `https://preview.minix-host-h5.pages.dev`
- preview `novel-h5` URL: `https://preview.minix-novel-h5.pages.dev`
- `pnpm verify:preview:remote`: not recorded in tracked source
- production Worker URL: not recorded in tracked source
- production `host-h5` URL: `https://minix-host-h5.pages.dev`
- production `novel-h5` URL: `https://minix-novel-h5.pages.dev`
- production evidence pack path: not recorded in tracked source
- production rendered evidence snippet: not recorded in tracked source
- drift comparison (`local -> preview -> production`): not recorded in tracked source

#### Manual WeChat Gate

- validator: not recorded in tracked source
- date: not recorded in tracked source
- target environment: not recorded in tracked source
- `host-wechat`: not recorded in tracked source
- `novel-wechat`: not recorded in tracked source
- notes: manual WeChat validation remains a required release gate, but the final operator evidence was not committed

#### Release Signoff

- owner: not recorded in tracked source
- decision: not recorded in tracked source
- blockers: provider rollout and WeChat validation evidence were not committed

#### Accepted Deferred Issues

- real SMS and OAuth provider credentials remain operator-owned
- real merchant credentials remain operator-owned
- external upload, review, short-link, and poster providers remain operator-owned
- Mini Program release proof still requires manual validation outside repo automation
