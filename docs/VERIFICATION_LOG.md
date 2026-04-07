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

- status: pending
- git tag:
- commit SHA:
- verification date:
- operator:

#### Final Local Gates

- `pnpm verify`:
- `pnpm verify:official-integrations`:
- `pnpm verify:h5:blackbox`:
- `pnpm verify:release`:

#### Remote Verification

- preview Worker URL:
- production Worker URL:
- `pnpm verify:api:remote` against production:
- preview `host-h5` URL:
- preview `novel-h5` URL:
- production `host-h5` URL:
- production `novel-h5` URL:

#### Manual WeChat Gate

- validator:
- date:
- target API URL:
- `host-wechat` result:
- `novel-wechat` result:
- notes:

#### Accepted Deferred Issues

- none recorded yet

## Notes

- The final coordinated `0.1.0` to `1.0.0` version bump should be recorded alongside the final `v1.0.0` entry.
- If a release is abandoned after an RC is cut, mark that RC section as superseded instead of deleting it.
