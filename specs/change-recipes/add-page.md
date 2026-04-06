---
title: Add Page
applies_to:
  - apps/host-wechat
  - apps/host-h5
---

# Add Page

## Use When

Expose an existing or new feature through a host-visible page.

## Default Steps

1. Confirm the page is needed for the current scope.
2. Run `pnpm scaffold:page <feature-name> <page-key>` when a scaffold is appropriate.
3. Implement or extend the feature behavior that backs the page.
4. Update host manifests and registries.
5. Regenerate or check WeChat shell files if coverage changed.
6. Run `pnpm verify`.

## Guardrails

- Keep host wiring manifest- and registry-driven.
- Do not create parallel handwritten route maps.
- Keep business behavior in the feature package instead of shell files.
