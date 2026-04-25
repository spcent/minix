# Product Matrix Reuse Playbook

MiniX is already organized around reusable business domains rather than one-off host pages. Use this playbook when adapting the current login, account, settings, messages, payment, content, search, list, detail, form, upload, share, and feedback matrix to another product.

The goal is to reuse existing contracts, feature controllers, API envelopes, page protocols, and host manifests before adding product-specific code.

## Reuse Path

For each requested product capability, map it in this order:

| Step | Decision | Reuse target |
| --- | --- | --- |
| 1 | Which canonical output does the product need? | `packages/contracts/src/api/*` or `packages/contracts/src/kernel/common-page.ts` |
| 2 | Is the behavior already shared? | `packages/features/*` or `packages/core/src/page-protocols/*` |
| 3 | Does the backend shape already exist? | `apps/api/src/domains/*` |
| 4 | Which official host exposes it? | `apps/*/src/manifest/page-definitions.ts` |
| 5 | What release evidence is required? | `docs/DOMAIN_COMPLETENESS_MATRIX.md`, `docs/PRODUCTION_READINESS.md`, `docs/VERIFICATION_LOG.md` |

If any step cannot be answered, add the smallest missing contract or shared controller extension first. Host pages should remain thin consumers of shared state.

## Current Reuse Recommendations

- Keep domain growth additive to the current API envelopes. The latest matrix already has stable shared outputs such as `session`, `accountSummary`, `preferences`, `notificationList`, `order`, `contentCard`, `searchResults`, `items`, `detailData`, `formValues`, `uploadTask`, `sharePayload`, and `feedbackTicket`.
- Use `packages/core/src/page-protocols/*` for list, detail, and form behavior. New products should not reimplement loading, pagination, detail status, draft, or submit state locally.
- Use `packages/core/src/store/snapshot.ts` when shared protocol, page protocol, or controller code needs immutable state snapshots. Prefer this small data-only helper over scattering raw clone calls in reusable factories, workspace/inbox controllers, form-heavy controllers, or lightweight feature initial-state cloning.
- Use the same snapshot helper in reusable feature model factories when defaults accept arrays, nested descriptors, uploaded assets, or backend bootstrap projections.
- Keep capability-backed features platform-neutral. Upload and share state belongs in `packages/features/media-tools`; adapter differences stay in `packages/platform-h5` and `packages/platform-wechat`.
- Normalize provider readiness and degraded behavior in contracts or shared controller state. Live credentials, provider dashboards, and callback evidence remain release/operator artifacts, not tracked source.
- Reuse `apps/api/src/domains/provider-posture.ts` for API-side `ProviderPostureMode` resolution and sample/production predicates across auth, messages, upload, and share; keep configured-provider fallbacks, base URL normalization, host extraction, and secret-material posture copy there too.
- Use `apps/api/src/domains/snapshot.ts` for API-domain workflow snapshots. Keep it local to the API app instead of importing core helpers into backend-only code.
- Extend `apps/api/src/domains/*` for business workflow shaping. Keep `apps/api/src/app.ts` as routing assembly and avoid pushing domain rules into host code.
- Prefer manifest changes and existing scaffolds for new host exposure. Generated registries and WeChat shell output should only change through generation scripts.

## Anti-Patterns To Avoid

- creating a second feature package for an existing domain, such as a parallel account, content, or media stack
- adding host-local response wrappers around canonical contract outputs
- storing provider secrets, merchant credentials, or private callback keys in tracked source
- deep-importing feature internals instead of package entry points
- calling `window.*`, `wx.*`, or other host globals from shared packages
- hand-editing generated page registries or WeChat shell files
- adding product-specific pagination, detail status, or form-submit enums when the page protocols already cover the workflow

## Product Matrix Intake Checklist

Use this checklist before creating implementation cards for another product:

- [ ] Capability rows are grouped by existing domain owner, not by page mockup.
- [ ] Each row names its canonical shared output.
- [ ] Gaps are classified as contract, controller, API domain, host manifest, adapter, provider rollout, or release evidence.
- [ ] Provider-backed rows state whether the repo can implement behavior or only document operator rollout.
- [ ] List/detail/form rows reuse page protocols unless a documented exception exists.
- [ ] New host exposure is scoped to the four official apps unless the task explicitly changes the frozen app surface.
- [ ] Verification is selected before implementation: `pnpm verify:feature <feature-name>`, `pnpm verify:host <host-name>`, or full `pnpm verify`.

## Task Card Grouping

Keep future cards coarse enough to protect reuse boundaries:

- one card for a product-matrix audit and shared-output mapping
- one card per shared primitive that multiple domains can reuse
- one card per host-surface adoption group when all changes share the same feature owner
- one card per provider rollout track when the remaining work is operational evidence

Avoid splitting every requested bullet into a separate card. Small cards are useful only when they have different owners, verification gates, or write sets.

## First Follow-Up From This Audit

Upload and share now expose similar provider posture fields: provider mode, explicit tracked-source secret posture, provider names, host fields, and readiness summaries. The reusable part should move to contracts kernel vocabulary, while each domain keeps its own provider-specific fields.

Track that implementation in [`../tasks/cards/done/0285-provider-posture-contract-normalization.md`](../tasks/cards/done/0285-provider-posture-contract-normalization.md).
