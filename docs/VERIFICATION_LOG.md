# MiniX Verification Log

This file records release verification evidence for MiniX.

Use it together with:

- [`CHANGELOG.md`](/CHANGELOG.md)
- [`docs/RELEASE_NOTES_TEMPLATE.md`](/docs/RELEASE_NOTES_TEMPLATE.md)
- [`docs/RELEASE_RUNBOOK.md`](/docs/RELEASE_RUNBOOK.md)

The intent is simple: release evidence should live in tracked source instead of terminal scrollback, chat history, or memory.

## How To Use This Log

- Add one section for each release candidate using the `v1.0.0-rc.N` name.
- Add one final section for `v1.0.0`.
- Record actual values, not placeholders, once a verification step is run.
- If a required field is intentionally unavailable, state why instead of leaving it ambiguous.
- Keep accepted deferred issues explicit and link back to the relevant milestone or changelog entry when possible.

## Required Evidence Fields

Each RC or final release record should capture:

- release name
- git commit SHA
- verification date
- operator or validator
- local verification commands run
- auth provider rollout evidence
- message provider rollout evidence and polling-only acceptance decision
- payment merchant and callback rollout evidence
- upload provider and asset-host rollout evidence
- share provider and attribution rollout evidence
- remote API URL and verification result
- preview H5 URLs and verification result
- production H5 URLs and verification result, when applicable
- manual WeChat validation owner, date, target environment, and result
- explicit go or no-go signoff owner and decision
- accepted deferred issues

## Active Bundle Evidence Rule

For the active release queue, use this log as the shared evidence record for `0241` through `0247`.

Minimum bundle evidence expectations:

- auth, message, payment, upload, and share rollout notes must be recorded as separate lines, not merged into one generic provider note
- preview and production validation state must be distinguishable when both environments are touched
- manual WeChat evidence must name the validator, target environment, and affected app
- final signoff must explicitly say go or no-go and list any remaining blockers

If a queue item remains pending because it is operator-owned, record `pending` explicitly rather than leaving the field blank.

## RC Records

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

#### Operator Rollout Evidence

- auth SMS provider:
- auth OAuth provider:
- OAuth callback domains:
- message providers:
- polling-only sync accepted for release:
- payment merchant rollout:
- payment callback secret configured:
- upload review provider:
- upload storage provider:
- upload asset base URL:
- share short-link provider:
- share poster provider:
- share short-link base URL:
- share poster base URL:

#### Remote Preview Verification

- preview Worker URL:
- `pnpm verify:api:remote`:
- preview `host-h5` URL:
- preview `novel-h5` URL:
- `pnpm verify:preview:remote`:

#### Manual WeChat Gate

- validator:
- date:
- target API URL:
- `host-wechat` result:
- `novel-wechat` result:
- notes:

#### Release Signoff

- signoff owner:
- decision:
- blockers:

#### Accepted Deferred Issues

- none recorded yet

### v1.0.0-rc.1

- status: pending execution
- commit SHA: fill from the RC candidate commit
- verification date:
- operator:

#### Local Gates

- `pnpm verify`: pending
- `pnpm verify:official-integrations`: pending
- `pnpm verify:h5:blackbox`: pending
- `pnpm verify:release`: pending

#### Operator Rollout Evidence

- auth SMS provider: pending
- auth OAuth provider: pending
- OAuth callback domains: pending
- message providers: pending
- polling-only sync accepted for release: pending explicit decision
- payment merchant rollout: pending
- payment callback secret configured: pending
- upload review provider: pending
- upload storage provider: pending
- upload asset base URL: pending
- share short-link provider: pending
- share poster provider: pending
- share short-link base URL: pending
- share poster base URL: pending

#### Remote Preview Verification

- preview Worker URL: pending
- `pnpm verify:api:remote`: pending
- preview `host-h5` URL: pending
- preview `novel-h5` URL: pending
- `pnpm verify:preview:remote`: pending

#### Manual WeChat Gate

- validator: pending
- date: pending
- target API URL: pending
- `host-wechat` result: pending
- `novel-wechat` result: pending
- notes: use the manual gate in [`docs/RELEASE_RUNBOOK.md`](/docs/RELEASE_RUNBOOK.md) and record failures explicitly.

#### Release Signoff

- signoff owner: pending
- decision: pending
- blockers:
  - provider rollout evidence not yet recorded
  - WeChat manual validation not yet recorded

#### Accepted Deferred Issues

- none recorded yet

## Final Release Record

### v1.0.0

- status: release-cut evidence recorded from tracked source
- git tag: not recorded in tracked source
- commit SHA: `d1c5232f0a6d63cfa585943ddd87353557c1c369`
- verification date: `2026-04-10`
- operator: `spcent <spcent@foxmail.com>`

#### Final Local Gates

- `pnpm verify`: passed
- `pnpm verify:official-integrations`: passed
- `pnpm verify:h5:blackbox`: passed
- `pnpm verify:release`: passed

#### Operator Rollout Evidence

- auth SMS provider: not recorded in tracked source
- auth OAuth provider: not recorded in tracked source
- OAuth callback domains: not recorded in tracked source
- message providers: not recorded in tracked source
- polling-only sync accepted for release: not recorded in tracked source
- payment merchant rollout: not recorded in tracked source
- payment callback secret configured: not recorded in tracked source
- upload review provider: not recorded in tracked source
- upload storage provider: not recorded in tracked source
- upload asset base URL: not recorded in tracked source
- share short-link provider: not recorded in tracked source
- share poster provider: not recorded in tracked source
- share short-link base URL: not recorded in tracked source
- share poster base URL: not recorded in tracked source

#### Remote Verification

- preview Worker URL: not recorded in tracked source
- production Worker URL: not recorded in tracked source
- `pnpm verify:api:remote` against production: not recorded in tracked source
- preview `host-h5` URL: `https://preview.minix-host-h5.pages.dev`
- preview `novel-h5` URL: `https://preview.minix-novel-h5.pages.dev`
- production `host-h5` URL: `https://minix-host-h5.pages.dev`
- production `novel-h5` URL: `https://minix-novel-h5.pages.dev`

#### Manual WeChat Gate

- validator: not recorded in tracked source
- date: not recorded in tracked source
- target API URL: not recorded in tracked source
- `host-wechat` result: not recorded in tracked source
- `novel-wechat` result: not recorded in tracked source
- notes: manual WeChat validation remains an explicit release requirement in [`docs/RELEASE_RUNBOOK.md`](/docs/RELEASE_RUNBOOK.md), but the final operator evidence was not committed to the repository.

#### Release Signoff

- signoff owner: not recorded in tracked source
- decision: not recorded in tracked source
- blockers: manual provider rollout and WeChat validation evidence were not committed to tracked source

#### Accepted Deferred Issues

- real SMS provider credentials are operator-owned and are not committed in tracked source
- real OAuth provider credentials and callback registrations are operator-owned and are not committed in tracked source
- no external object storage bucket binding is committed; upload lifecycle is release-backed through the sample backend surface
- payment callback verification is implemented, but live merchant credentials are operator-owned and are not committed in tracked source
- WeChat release proof still requires manual DevTools or device validation outside repository automation

## Notes

- The final coordinated version bump is part of the final `v1.0.0` release-cut commit and should be referenced from the final release entry.
- If a release is abandoned after an RC is cut, mark that RC section as superseded instead of deleting it.
