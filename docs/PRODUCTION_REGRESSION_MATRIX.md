# MiniX Production Regression Matrix

This matrix is the release-facing view of what is automated today, what still requires operator confirmation, and which command proves each area.

Use it together with [`docs/RELEASE_RUNBOOK.md`](/Users/bingrong.yan/projects/birdor/minix/docs/RELEASE_RUNBOOK.md). The runbook is the operator sequence. This file is the coverage map.

## Required Commands

Run from the repo root:

```bash
pnpm verify
pnpm verify:official-integrations
pnpm verify:h5:blackbox
pnpm verify:release
```

Remote preview promotion also requires:

```bash
MINIX_API_BASE_URL="https://<preview-worker>.workers.dev" pnpm verify:api:remote
MINIX_API_BASE_URL="https://<preview-worker>.workers.dev" \
MINIX_HOST_H5_BASE_URL="https://preview.minix-host-h5.pages.dev" \
MINIX_NOVEL_H5_BASE_URL="https://preview.minix-novel-h5.pages.dev" \
pnpm verify:preview:remote
```

## Operator-Owned Launch Checks

These items are required for release, but they are not proved by repository automation alone.

| Area | Repo automation coverage | Operator evidence needed |
| --- | --- | --- |
| Worker env vars and bindings | partial; automation proves behavior after config is present | env inventory, `DB` and `AUTH_RATE_LIMIT_KV` binding confirmation, deployed target URL |
| WeChat domain allowlists | none | request, `uploadFile`, and `downloadFile` allowlists recorded against the deployed API domain |
| H5 CORS and remote API base URL | partial; remote verification proves runtime only after config is present | deployed H5 URL list plus matching CORS or Pages config |
| External auth, payment, message, upload, and share providers | partial; contracts and local tests prove shared fallback and production posture | provider rollout confirmation, callback endpoints, and secret ownership recorded |
| WeChat manual gate | none | validator, environment, device or DevTools target, and pass or fail notes |

## Release Evidence Minimum

Every RC or final release record should capture:

- git SHA
- preview and production Worker URLs
- preview and production H5 URLs when applicable
- command results for local and remote verification
- WeChat validator name and date
- explicit go or no-go owner

## Automated Coverage

| Area | Local automation | Primary proof |
| --- | --- | --- |
| repo boundaries, contracts, manifests, type safety | yes | `pnpm verify` |
| official host integration against local API | yes | `pnpm verify:official-integrations` |
| host-h5 login, protected plan access, settings, logout | yes | [`tests/e2e/h5-release-smoke.spec.ts`](/Users/bingrong.yan/projects/birdor/minix/tests/e2e/h5-release-smoke.spec.ts) |
| novel-h5 login, reader save, home continuity | yes | [`tests/e2e/h5-release-smoke.spec.ts`](/Users/bingrong.yan/projects/birdor/minix/tests/e2e/h5-release-smoke.spec.ts) |
| host-h5 inbox route restore and selected thread recovery | yes | [`tests/e2e/h5-regression-matrix.spec.ts`](/Users/bingrong.yan/projects/birdor/minix/tests/e2e/h5-regression-matrix.spec.ts) |
| host-h5 guest upgrade flow | yes | [`tests/e2e/h5-regression-matrix.spec.ts`](/Users/bingrong.yan/projects/birdor/minix/tests/e2e/h5-regression-matrix.spec.ts) |
| host-h5 search center route write-back and reload recovery | yes | [`tests/e2e/h5-regression-matrix.spec.ts`](/Users/bingrong.yan/projects/birdor/minix/tests/e2e/h5-regression-matrix.spec.ts) |
| host-h5 feedback submit with attachments | yes | [`tests/e2e/h5-regression-matrix.spec.ts`](/Users/bingrong.yan/projects/birdor/minix/tests/e2e/h5-regression-matrix.spec.ts) |
| host-h5 upload and share workspace | yes | [`tests/e2e/h5-regression-matrix.spec.ts`](/Users/bingrong.yan/projects/birdor/minix/tests/e2e/h5-regression-matrix.spec.ts) |
| novel-h5 membership purchase and paid return | yes | [`tests/e2e/h5-regression-matrix.spec.ts`](/Users/bingrong.yan/projects/birdor/minix/tests/e2e/h5-regression-matrix.spec.ts) |
| content lifecycle draft, review, publish, archive, restore | yes | [`apps/api/src/app.test.ts`](/Users/bingrong.yan/projects/birdor/minix/apps/api/src/app.test.ts) |
| payment callback signature, replay protection, reconciliation | yes | [`apps/api/src/app.test.ts`](/Users/bingrong.yan/projects/birdor/minix/apps/api/src/app.test.ts) |
| upload session, chunk, complete, asset retrieval | yes | [`apps/api/src/app.test.ts`](/Users/bingrong.yan/projects/birdor/minix/apps/api/src/app.test.ts) |
| message thread read, send, retry, sync | yes | [`apps/api/src/app.test.ts`](/Users/bingrong.yan/projects/birdor/minix/apps/api/src/app.test.ts) |
| background jobs and governance diagnostics | yes | [`apps/api/src/app.test.ts`](/Users/bingrong.yan/projects/birdor/minix/apps/api/src/app.test.ts) |

## Route And Session Recovery Matrix

| Scenario | Automated | Proof |
| --- | --- | --- |
| inbox filters and selected thread survive reload | yes | host inbox recovery spec |
| search keyword writes back into route and survives reload | yes | host feed regression spec |
| membership payment returns out of the paywall state | yes | novel membership regression spec |
| logout clears session and stops silent restore | yes | host release smoke and regression spec |

## WeChat Manual Coverage

The following remain manual because repository CI cannot run real WeChat DevTools with production host bindings:

| Surface | Required manual check |
| --- | --- |
| host-wechat auth | sign in, forced re-entry after protected deep link, logout, relaunch after logout |
| host-wechat account | account center loads real profile and security state, identity operations entry points render correctly |
| host-wechat search, inbox, feedback | search/filter/open works, inbox filters and reserved threads render, feedback submit and refresh succeed |
| host-wechat media tools | upload and share show the expected native or degraded behavior without runtime errors |
| novel-wechat reading loop | catalog, detail, reader save, bookshelf continuity, settings return path |
| novel-wechat membership | locked flow enters membership, purchase succeeds, return path restores the intended reading context |

Use the detailed checklist in [`docs/RELEASE_RUNBOOK.md`](/Users/bingrong.yan/projects/birdor/minix/docs/RELEASE_RUNBOOK.md).

## Known Manual-Only Risks

- Real WeChat upload and share capability differences still require device-level confirmation.
- Remote Cloudflare preview and production promotion still require operator-owned credentials and allowlist checks.
- Native payment channels beyond the sample gateway remain operationally validated through callback verification plus manual remote smoke.
