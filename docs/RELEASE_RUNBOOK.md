# MiniX Release Runbook

This runbook defines the minimum path from a verified commit to preview and production promotion for the current `v1.0.0` sample surface.

Use it together with:

- [`../README.md`](../README.md)
- [`./PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md)
- [`./VERIFICATION_LOG.md`](./VERIFICATION_LOG.md)

## Release Scope

The official release surface is:

- `apps/api`
- `apps/host-h5`
- `apps/host-wechat`
- `apps/novel-h5`
- `apps/novel-wechat`

The supported remote environments are:

- `preview`
- `production`

## Preconditions

Before any RC or production promotion:

- the intended release commit is selected and the working tree is reviewed
- real Cloudflare ids live only in the ignored `apps/api/wrangler.private.jsonc`
- `wrangler` authentication works
- Playwright Chromium is installed
- WeChat DevTools can open both Mini Program samples
- no mock-only bootstrap override is active in the validation session

## Active Release Bundle

The current active release queue is:

- `0241` auth provider rollout
- `0242` message provider rollout and polling acceptance
- `0243` payment rollout and callback ops
- `0244` upload provider rollout and asset-host cutover
- `0245` share rollout and attribution ops
- `0246` release execution and signoff

Coordination card `0247` is already closed and defines the queue shape.

Execution rule:

1. Confirm the `0247` coordination baseline still matches the target environment and evidence location.
2. `0241` to `0245` may proceed in parallel after that.
3. `0246` closes only after provider rollout, remote verification, manual WeChat validation, and signoff evidence are recorded.

## Local Release Gate

Run from the repo root:

```bash
pnpm install
pnpm exec playwright install chromium
pnpm verify
pnpm verify:official-integrations
pnpm verify:h5:blackbox
pnpm verify:release
```

Record the command results in [`./VERIFICATION_LOG.md`](./VERIFICATION_LOG.md).

## Preview Promotion

1. Confirm Cloudflare access:

```bash
pnpm api:whoami
```

2. Apply preview migrations and deploy the preview Worker:

```bash
pnpm api:d1:migrate:preview
pnpm api:deploy:preview
```

3. Verify the preview API:

```bash
MINIX_API_BASE_URL="https://<preview-worker>.workers.dev" \
MINIX_REMOTE_EVIDENCE_OUTPUT=".tmp/preview-remote-evidence.json" \
pnpm verify:api:remote
pnpm verify:api:remote:render .tmp/preview-remote-evidence.json preview
```

After API verification, inspect the authenticated `/ops/diagnostics` response on the target environment and confirm the provider-readiness summary matches the intended rollout posture for auth, messages, payment callbacks, upload, and share.

4. Deploy both H5 samples to Pages preview:

```bash
MINIX_API_BASE_URL="https://<preview-worker>.workers.dev" pnpm pages:deploy:host-h5:preview
MINIX_API_BASE_URL="https://<preview-worker>.workers.dev" pnpm pages:deploy:novel-h5:preview
```

5. Verify the preview host pair:

```bash
MINIX_API_BASE_URL="https://<preview-worker>.workers.dev" \
MINIX_HOST_H5_BASE_URL="https://preview.minix-host-h5.pages.dev" \
MINIX_NOVEL_H5_BASE_URL="https://preview.minix-novel-h5.pages.dev" \
pnpm verify:preview:remote
```

6. Run the manual WeChat gate against the preview target.

## Manual WeChat Gate

Validate both `apps/host-wechat` and `apps/novel-wechat` against the intended API target.

Minimum checks:

- startup succeeds without runtime errors
- sign-in succeeds against the target API
- protected navigation and route return behave correctly
- account, settings, inbox, feedback, and media-tools surfaces do not regress
- novel catalog, detail, reader, bookshelf, and membership flows do not regress
- logout or session reset behaves correctly

Do not promote if either Mini Program sample crashes, hangs, falls back to mock-only behavior, or loses the expected route return or persistence behavior.

## Production Promotion

After preview passes:

1. Re-run the local release gate on the intended production commit if it changed after preview.
2. Deploy the production Worker:

```bash
pnpm api:d1:migrate:production
pnpm api:deploy:production
MINIX_API_BASE_URL="https://<production-worker>.workers.dev" \
MINIX_REMOTE_EVIDENCE_OUTPUT=".tmp/production-remote-evidence.json" \
pnpm verify:api:remote
pnpm verify:api:remote:render .tmp/production-remote-evidence.json production
pnpm verify:api:remote:compare .tmp/preview-remote-evidence.json .tmp/production-remote-evidence.json
```

3. Deploy both H5 samples to Pages production:

```bash
MINIX_API_BASE_URL="https://<production-worker>.workers.dev" pnpm pages:deploy:host-h5:production
MINIX_API_BASE_URL="https://<production-worker>.workers.dev" pnpm pages:deploy:novel-h5:production
```

4. Repeat the manual WeChat gate against the production API target.
5. Inspect `/ops/diagnostics` again on production and confirm the provider-readiness summary matches the final rollout decision.
6. Update [`./VERIFICATION_LOG.md`](./VERIFICATION_LOG.md) with commit SHA, URLs, command results, provider rollout evidence, manual validation, and final signoff.
7. Only then publish the final release record.

## Provider Rollout Checklist

Run this checklist while executing `0241` to `0245`:

- auth:
  confirm `providerReadiness.auth.sms` and `providerReadiness.auth.oauth` match the intended posture, then record SMS provider, OAuth provider, callback domain, and manual login or bind validation
- messages:
  confirm `providerReadiness.messages.touchpoints` matches the intended posture, then record channel owners and whether polling-only sync is accepted for the target release
- payment:
  confirm `providerReadiness.payment.callbacks` matches the intended posture, then record merchant owner, callback-secret confirmation, and purchase or refund validation
- upload:
  confirm `providerReadiness.upload.pipeline` matches the intended posture, then record storage provider, review provider, asset host URL, and upload validation
- share:
  confirm `providerReadiness.share.distribution` matches the intended posture, then record short-link provider, poster provider, deployed URLs, and short-link or attribution validation

If any area remains `review` or `blocked`, do not hide it inside generic release notes. Record the exact remaining blocker or explicit release deferral in [`./VERIFICATION_LOG.md`](./VERIFICATION_LOG.md).

## Operator Evidence Workflow

Use this same flow for `0241` to `0246` on preview and production:

1. deploy or update the target environment
2. run `MINIX_REMOTE_EVIDENCE_OUTPUT="<path>" pnpm verify:api:remote`
3. run `pnpm verify:api:remote:render <path> <label>`
4. inspect authenticated `/ops/diagnostics` and confirm the matching `providerReadiness.*` keys
5. paste the rendered snippet and manual validation notes into [`./VERIFICATION_LOG.md`](./VERIFICATION_LOG.md)
6. mark the relevant task card only after the evidence log and the target posture match

Recommended evidence pack paths:

- preview: `.tmp/preview-remote-evidence.json`
- production: `.tmp/production-remote-evidence.json`

Recommended ownership split:

- `0241` auth: provider names, callback domain, login or bind proof
- `0242` messages: channel owners, polling-only decision, inbox or notification proof
- `0243` payment: merchant owner, callback confirmation, purchase or refund proof
- `0244` upload: storage owner, review owner, asset host URL, upload or attach proof
- `0245` share: short-link owner, poster owner, deployed URL proof, attribution proof
- `0246` release: preview or production URLs, WeChat validator, final go or no-go signoff

## Required Evidence

Every RC or final release record should capture:

- release name
- commit SHA
- local gate results
- preview and production API URLs when applicable
- preview and production H5 URLs when applicable
- manual WeChat validator, date, target environment, and result
- auth, message, payment, upload, and share rollout state
- signoff owner and go/no-go decision

## Rollback Rule

Use the smallest rollback that restores a known good state:

- redeploy the previous Worker if the API regressed
- redeploy the previous H5 host build if the web host regressed
- rerun remote verification against the rolled-back environment
- rerun the Mini Program manual gate only for affected flows

## Hotfix Rule

For a post-release hotfix:

1. isolate the smallest reversible patch
2. rerun `pnpm verify`
3. rerun `pnpm verify:official-integrations`
4. rerun `pnpm verify:h5:blackbox` if H5 behavior changed
5. redeploy preview first if API behavior changed
6. rerun the manual WeChat gate only for affected flows
7. promote only after the updated evidence is recorded
