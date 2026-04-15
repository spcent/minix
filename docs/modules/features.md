# Features Workspace

Path: `packages/features/*`

Use one workspace package per business area, such as:

- `auth`
- `items`
- `settings`
- `messages`
- `media-tools`
- `catalog`
- `reader`

Feature packages should contain:

- controllers
- models
- feature defaults
- feature-owned types

Feature packages should not contain:

- raw platform API usage
- host app wiring
- cross-feature catch-all abstractions

Create new features with `pnpm scaffold:feature <feature-name> [generic|auth|profile|list|detail|form|workspace]`.

Related references:

- [Feature Design Guide](../../packages/features/README.md)
- [Add Feature Recipe](../../specs/change-recipes/add-feature.md)
