---
title: Add Feature
applies_to:
  - packages/features/*
---

# Add Feature

## Use When

Add a new business area that does not fit an existing feature package.

## Default Steps

1. Confirm the feature stays within current product scope.
2. Run `pnpm scaffold:feature <feature-name>`.
3. Implement feature-owned models, controllers, and defaults in `packages/features/<feature-name>`.
4. Add or update contracts only if the shared surface changes.
5. Wire host-visible pages only if the feature actually needs them.
6. Run `pnpm verify`.

## Guardrails

- Keep the feature platform-agnostic.
- Expose only `src/index.ts`.
- Do not add direct `wx.*` or `window.*` usage.
- Move cross-feature abstractions to `packages/core` or `packages/contracts`, not to a catch-all feature package.
