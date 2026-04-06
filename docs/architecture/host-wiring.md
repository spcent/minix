# Host Wiring

Host wiring is intentionally data-driven so agents and scripts can reason about it without source parsing heuristics.

## Source Of Truth

- host manifests define page metadata and route-facing configuration
- host registries bind host entry points to shared feature behavior
- generated WeChat shell files mirror the registry and manifest output

## Current Rule

Do not introduce handwritten parallel route maps when a manifest or registry already exists.

For `v0.1`, the practical edit path is:

1. update contracts only if the route or payload surface changes
2. implement feature behavior in `packages/features/*`
3. adjust platform adapters if platform behavior differs
4. update host manifest or registry
5. regenerate or check shells when WeChat page coverage changes

## Why This Matters

- route coverage can be checked by scripts
- host-specific code stays thin
- feature behavior remains portable across WeChat and H5
- agent edits stay local and reversible

Related references:

- [Host Route Checks](../../scripts/check-host-routes.mjs)
- [Host Wiring Checks](../../scripts/check-host-wiring.mjs)
- [WeChat Shell Sync](../../scripts/sync-host-wechat-shells.ts)
