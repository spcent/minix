# Feature Design Guide

`packages/features/*` is a workspace of small feature packages, not one large shared feature package.

This is the preferred structure for MiniX because it keeps edits local, boundaries explicit, and agent changes easier to verify.

## Rules

- Use one package per feature under `packages/features/<feature-name>`.
- Expose each feature through `src/index.ts` only.
- Keep feature code focused on business behavior such as models, controllers, defaults, and feature-owned types.
- A feature package may depend on `@minix/contracts` and `@minix/core`, but not on platform packages or host apps.
- Do not call `wx.*` or `window.*` inside a feature package.
- Do not use deep imports across workspace packages.
- If behavior is shared by many features, move it to `packages/core` or `packages/contracts` instead of creating a catch-all feature package.

## Why This Shape

- Smaller packages give agents a narrower and safer edit surface.
- Package boundaries make accidental cross-feature coupling easier to spot.
- Validation scripts can enforce dependency direction and public entry usage.
- Scaffolding stays predictable when every feature follows the same layout.

## Preferred Workflow

Create a new feature with:

```bash
pnpm scaffold:feature <feature-name>
```

Add host page wiring only when the feature needs a host-visible page:

```bash
pnpm scaffold:page <feature-name> <page-key>
```

Avoid merging multiple business areas into a single `packages/features` package unless the repository scope changes intentionally.
