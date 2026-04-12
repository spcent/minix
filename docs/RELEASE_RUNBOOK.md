# MiniX v1.0 Release Runbook

This runbook defines the minimum operator path from local verification to `release candidate` promotion and final `v1.0` release.

It exists because MiniX now has strong repo-level verification, but the final release still includes manual WeChat validation and Cloudflare promotion steps that should not live only in chat history.

Coverage ownership by workflow is tracked in [`docs/PRODUCTION_REGRESSION_MATRIX.md`](/Users/bingrong.yan/projects/birdor/minix/docs/PRODUCTION_REGRESSION_MATRIX.md).

## Release Scope

The frozen official `v1.0` sample surface is:

- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`
- `apps/api`

The supported remote API environments are:

- `preview`
- `production`

The current remote state is expected to use:

- D1: `minix-api-preview`
- D1: `minix-api-production`
- Cloudflare default `workers.dev` domains before any custom-domain cutover
- Cloudflare Pages project `minix-host-h5`
- Cloudflare Pages project `minix-novel-h5`

## Release Naming And Version Source Of Truth

Use these rules consistently:

- RC builds should be recorded as `v1.0.0-rc.N`
- the final public release tag should be `v1.0.0`
- [`CHANGELOG.md`](/CHANGELOG.md) is the human-readable release note source of truth
- [`docs/RELEASE_NOTES_TEMPLATE.md`](/docs/RELEASE_NOTES_TEMPLATE.md) is the required note structure for RC and final announcements
- tracked package manifests and runtime version stamps report `1.0.0` in the final release-cut commit

## Preconditions

Before promoting an RC or final release, confirm:

- the working tree is clean, or any intentional release-only diffs are already reviewed
- `preview` and `production` Cloudflare bindings are prepared from the safe template [`apps/api/wrangler.jsonc`](/apps/api/wrangler.jsonc)
- the real remote ids live only in the ignored `apps/api/wrangler.private.jsonc`
- `wrangler` authentication is valid
- Playwright Chromium is installed locally
- WeChat DevTools can open both official WeChat samples
- no `globalThis.__MINIX_BOOTSTRAP_ENV__ = { useMock: true }` override is active in the validation session

## RC Checklist

Run from the repo root unless a step says otherwise.

1. Install dependencies.

```bash
pnpm install
pnpm exec playwright install chromium
```

2. Run the repo gate.

```bash
pnpm verify
```

3. Run the real local API integration gate.

```bash
pnpm verify:official-integrations
pnpm verify:h5:blackbox
pnpm verify:release
```

`pnpm verify:h5:blackbox` now runs the full local Playwright matrix under [`tests/e2e`](/Users/bingrong.yan/projects/birdor/minix/tests/e2e), not only the original smoke file.

4. Verify Cloudflare access before any remote promotion.

```bash
pnpm api:whoami
```

If `apps/api/wrangler.private.jsonc` does not exist yet, create it from the committed template and fill in the real remote ids before any preview or production migration:

```bash
cp apps/api/wrangler.jsonc apps/api/wrangler.private.jsonc
```

5. Apply preview migrations and deploy preview.

```bash
pnpm api:d1:migrate:preview
pnpm api:deploy:preview
```

6. Record the emitted `workers.dev` URL and verify the remote API surface.

```bash
MINIX_API_BASE_URL="https://<preview-worker>.workers.dev" pnpm verify:api:remote
```

7. Deploy the official H5 samples to Cloudflare Pages preview.

```bash
MINIX_API_BASE_URL="https://<preview-worker>.workers.dev" pnpm pages:deploy:host-h5:preview
MINIX_API_BASE_URL="https://<preview-worker>.workers.dev" pnpm pages:deploy:novel-h5:preview
```

Expected preview H5 URLs:

- `https://preview.minix-host-h5.pages.dev`
- `https://preview.minix-novel-h5.pages.dev`

8. Run the scripted preview proof against the deployed preview URLs.

```bash
MINIX_API_BASE_URL="https://<preview-worker>.workers.dev" \
MINIX_HOST_H5_BASE_URL="https://preview.minix-host-h5.pages.dev" \
MINIX_NOVEL_H5_BASE_URL="https://preview.minix-novel-h5.pages.dev" \
pnpm verify:preview:remote
```

9. Perform the manual WeChat gate in DevTools.

10. If every step passes, mark the build as `RC`.
11. Record the RC as `v1.0.0-rc.N` in [`docs/VERIFICATION_LOG.md`](/docs/VERIFICATION_LOG.md), then use the release note template and changelog source of truth before moving on.

## Manual WeChat Gate

The WeChat gate complements automation. It is a release blocker if either official Mini Program sample fails these checks.

### Shared Setup

- import [`apps/host-wechat`](/apps/host-wechat) and [`apps/novel-wechat`](/apps/novel-wechat) into WeChat DevTools
- keep `miniprogramRoot` set to `miniprogram/`
- create ignored private config files before real release validation:
  - `cp apps/host-wechat/project.private.config.json.example apps/host-wechat/project.private.config.json`
  - `cp apps/novel-wechat/project.private.config.json.example apps/novel-wechat/project.private.config.json`
- validate against the intended API target:
  - local smoke: default `http://localhost:3000`
  - preview smoke: `globalThis.__MINIX_BOOTSTRAP_ENV__ = { apiBaseUrl: "https://<preview-worker>.workers.dev" }`
- do not enable mock mode for release validation
- use separate real Mini Program `appId` values for `host-wechat` and `novel-wechat`
- configure the final HTTPS API domain in WeChat console allowlists before preview or production validation:
  - request合法域名
  - uploadFile合法域名
  - downloadFile合法域名

### `host-wechat` Manual Gate

Confirm all of the following:

- app opens to login without runtime errors
- sign in succeeds and unlocks the protected navigation path
- protected deep-link entry returns to the intended route after sign-in instead of dropping back to home
- overview renders after sign-in
- `/items` loads protected data instead of a mock placeholder
- marking progress or navigating through the lesson does not break state
- account center renders real summary, status, and security sections
- account identity entry points render correctly for the current session shape
- search center query, filter changes, and route restoration behave consistently
- inbox filters, unread toggles, and reserved thread summaries render without stale state
- feedback submit, latest status refresh, and sample attachment capture succeed
- media tools upload/share open the correct native or degraded flow without runtime errors
- settings opens with authenticated state
- logout clears session state and returns to login
- relaunch after logout does not silently restore a revoked session

### `novel-wechat` Manual Gate

Confirm all of the following:

- app opens without runtime errors
- sign in succeeds against the intended API target
- catalog loads real sample covers and not broken external placeholders
- catalog search and recent or hot term reuse behave correctly
- detail view opens from catalog
- reader opens from detail or continue-reading affordances
- saving reading progress succeeds
- bookshelf reflects the expected saved or default state
- membership center opens for locked flows
- membership purchase returns to the intended route context
- returning from membership back into reader or TOC preserves the expected chapter target
- preferences changes return cleanly to the reading flow that launched them

### Manual Gate Failure Rule

Do not promote from `preview` to `production` if:

- either WeChat app crashes or hangs during startup
- either flow accidentally uses mock-only data or behavior
- login, logout, bookshelf, reader save, or membership return cannot be completed once end to end

## Final Release Promotion

After RC passes:

1. Re-run the local release gates on the commit you plan to tag.
2. Re-run the preview deploy and remote API verification if the API changed after the last RC.
3. Promote the API schema and Worker to `production`.

```bash
pnpm api:d1:migrate:production
pnpm api:deploy:production
MINIX_API_BASE_URL="https://<production-worker>.workers.dev" pnpm verify:api:remote
```

4. Deploy the official H5 samples to Cloudflare Pages production.

```bash
MINIX_API_BASE_URL="https://<production-worker>.workers.dev" pnpm pages:deploy:host-h5:production
MINIX_API_BASE_URL="https://<production-worker>.workers.dev" pnpm pages:deploy:novel-h5:production
```

Expected production H5 URLs:

- `https://minix-host-h5.pages.dev`
- `https://minix-novel-h5.pages.dev`

5. Repeat the manual WeChat gate against the production API target.
6. Update [`docs/VERIFICATION_LOG.md`](/docs/VERIFICATION_LOG.md) with:
   - git commit SHA
   - preview Worker URL
   - production Worker URL
   - preview H5 URLs
   - production H5 URLs
   - verification commands executed
   - manual WeChat validator and date
7. Confirm tracked package manifests and runtime version stamps still report `1.0.0`.
8. Update [`CHANGELOG.md`](/CHANGELOG.md) with the final release record and render the announcement from [`docs/RELEASE_NOTES_TEMPLATE.md`](/docs/RELEASE_NOTES_TEMPLATE.md).
9. Only then create the `v1.0.0` release tag and publish the `v1.0.0` announcement.

## Rollback

Use the narrowest rollback that restores a known good state.

### API Rollback

- redeploy the previous known-good Worker bundle to the affected environment
- if a schema change caused the regression, stop and evaluate forward-fix vs data rollback before applying more migrations
- re-run `pnpm verify:api:remote` against the rolled-back environment

## Debugging Path

Use this minimum path before treating a preview or production API issue as unknown:

1. capture the client-side `x-trace-id` from the failing request, or reproduce with a known trace id
2. run:

```bash
pnpm api:tail:preview
```

or:

```bash
pnpm api:tail:production
```

3. match the echoed `X-Trace-Id` response header to the Worker log line
4. confirm whether the failure is auth, CORS, or route/data specific

Current support assumptions:

- auth failure and auth throttling logs include the trace id
- `pnpm verify:api:remote` checks trace-id echo behavior for remote API verification
- client requests are expected to send `x-trace-id`, and the API echoes it back even on error responses

### Sample App Rollback

- retag or redeploy the previous known-good host commit
- confirm the same API target still works with the rolled-back hosts
- re-run the manual WeChat gate for the affected app only if the rollback touches Mini Program behavior

## Hotfix Path

For a post-release hotfix:

1. isolate the smallest reversible patch
2. run `pnpm verify`
3. run `pnpm verify:official-integrations`
4. run `pnpm verify:h5:blackbox` if H5 behavior changed
5. redeploy preview first if the API changed
6. repeat the manual WeChat gate only for the impacted flows
7. promote to production after the fix is re-verified

## Release Record

Every RC or final release should capture a short note with:

- release name or tag
- commit SHA
- local gates that passed
- remote API URL verified
- whether WeChat manual validation passed
- any known deferred issues that are explicitly accepted

Use [`CHANGELOG.md`](/CHANGELOG.md) as the release note ledger and [`docs/RELEASE_NOTES_TEMPLATE.md`](/docs/RELEASE_NOTES_TEMPLATE.md) as the note shape.
