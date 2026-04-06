# Workflow Examples

These files are intentionally stored under `docs/workflows/` and not under `.github/workflows/`.

MiniX currently prefers manual release control over automatic GitHub-triggered pipelines. The YAML files in this folder are reference workflow examples only.

Current examples:

- `release-readiness.yml`: reference CI gate for `pnpm verify:release`
- `deploy-api.yml`: reference manual dispatch flow for Cloudflare API deploys

If the repository later decides to re-enable GitHub Actions, copy the reviewed files back into `.github/workflows/` as a deliberate release-operations decision.
