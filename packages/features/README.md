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

## When Completing Existing Features

- Prefer extending an existing feature package over creating a sibling package for the same domain.
- Keep the feature controller as the main owner of normalized page state, route sync, action lifecycle, and shared output projection.
- Reuse canonical outputs from `packages/contracts/src/api/*` instead of inventing feature-local wrappers around API responses.
- When the feature needs shared loading, detail, or submit state, prefer the page protocols in `packages/core` over bespoke flags.
- Keep host-only capability or UI differences out of the feature package.
- If a feature needs a domain exception, document it in the repository docs instead of encoding it as unexplained controller drift.

## Preferred Internal Shape

For most feature packages, prefer this division:

- `model` or state helpers for feature-owned data shaping
- `controller` for workflows, route sync, and action orchestration
- `feature.manifest` for host-facing route metadata and defaults
- tests close to the controller and manifest behavior

Avoid turning a feature package into a second runtime layer or a host-specific page folder in disguise.

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

## Test Expectations

- Update controller tests when state projection, route restore, action lifecycle, or error handling changes.
- Update manifest tests when route ownership or host-visible defaults change.
- Let API-domain tests cover server behavior; feature tests should focus on shared controller behavior and state.
