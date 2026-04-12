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
- remote API URL and verification result
- preview H5 URLs and verification result
- production H5 URLs and verification result, when applicable
- manual WeChat validation owner, date, target environment, and result
- accepted deferred issues

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
- notes: manual WeChat validation remains an explicit release requirement in [`docs/RELEASE_RUNBOOK.md`](/Users/bingrong.yan/projects/birdor/minix/docs/RELEASE_RUNBOOK.md), but the final operator evidence was not committed to the repository.

#### Accepted Deferred Issues

- real SMS provider credentials are operator-owned and are not committed in tracked source
- real OAuth provider credentials and callback registrations are operator-owned and are not committed in tracked source
- no external object storage bucket binding is committed; upload lifecycle is release-backed through the sample backend surface
- payment callback verification is implemented, but live merchant credentials are operator-owned and are not committed in tracked source
- WeChat release proof still requires manual DevTools or device validation outside repository automation

## Notes

- The final coordinated version bump is part of the final `v1.0.0` release-cut commit and should be referenced from the final release entry.
- If a release is abandoned after an RC is cut, mark that RC section as superseded instead of deleting it.
