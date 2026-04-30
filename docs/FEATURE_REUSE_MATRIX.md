# Feature Reuse Matrix

This matrix shows how the current feature packages are reused across the four official `v1.0.0` hosts. It is a planning aid for reducing host-local duplication without expanding the sample surface.

Legend:

- `controller`: host uses the shared feature controller through its feature manifest
- `render`: host supplies platform or product-specific presentation
- `capability`: page declares host capability requirements
- `api`: feature consumes a shared API domain envelope

| Feature | host-h5 | host-wechat | novel-h5 | novel-wechat | Notes |
| --- | --- | --- | --- | --- | --- |
| `auth` | controller, render, api | controller, shell, api | controller, render, api | controller, shell, api | Shared identity workflows; provider rollout remains operator-owned for SMS and OAuth. |
| `account` | controller, render, capability, api | controller, shell, capability, api | controller, render, capability, api | controller, shell, capability, api | Account workspace is the preferred home for future profile, relation, and identity growth. |
| `settings` | controller, render, capability, api | controller, shell, capability, api | controller, render, api | controller, shell, api | Reader settings are product-specific defaults over the same feature package. |
| `items` | controller, render, api | controller, shell, api | not used | not used | Generic shared-flow sample feature; do not reuse for novel catalog behavior. |
| `feed` | controller, render, api | controller, shell, api | controller, render, api | controller, shell, api | Discover/search/content growth should stay additive to this shared surface. |
| `messages` | controller, render, api | controller, shell, api | controller, render, api | controller, shell, api | Polling-only sync remains an explicit release posture until a non-polling provider exists. |
| `feedback` | controller, render, api | controller, shell, api | controller, render, api | controller, shell, api | Support-loop vocabulary should stay aligned with messages and media-tools context. |
| `media-tools` | controller, render, capability, api | controller, shell, capability, api | controller, render, capability, api | controller, shell, capability, api | Upload/share provider posture belongs in shared outputs and diagnostics, not host fallback copy. |
| `subscription` | controller, render, capability, api | controller, shell, capability, api | controller, render, capability, api | controller, shell, capability, api | Payment remains provider/operator-owned for production merchant setup. |
| `catalog` | not used | not used | controller, render, api | controller, shell, api | Novel-specific product line over shared list/search conventions. |
| `novel-detail` | not used | not used | controller, render, api | controller, shell, api | Detail protocol adoption remains bounded to the novel line. |
| `reader` | not used | not used | controller, render, api | controller, shell, api | Reader display and progress behavior stays feature-owned. |
| `bookshelf` | not used | not used | controller, render, api | controller, shell, api | Reading-center persistence should stay shared between novel hosts. |
| `toc` | not used | not used | controller, render, api | controller, shell, api | Route restore and locked-chapter routing should stay controller-owned. |

## Reuse Decisions

Before creating a new feature package, answer these questions:

1. Does an existing contract envelope already carry the output?
2. Does an existing feature own the matching controller workflow?
3. Is the difference only page copy, initial state, route target, or capability requirement?
4. Can host-specific behavior stay in `page-definitions.ts` or a platform adapter?

Create a new feature only when the business owner, state machine, and canonical output are genuinely separate from the existing packages.

## Current Duplication Targets

These are safe areas to inspect after release closure:

- repeated authenticated guard helpers in host page definitions
- repeated support-page controller config for feedback, messages, and media-tools
- repeated capability requirements for clipboard, upload, share, and payment
- repeated provider evidence copy in release docs

Keep any extraction small. If a helper hides route ownership or makes host wiring harder to read, keep the explicit host config.
