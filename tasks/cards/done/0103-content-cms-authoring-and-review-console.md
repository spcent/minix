# Card 0103 Content CMS Authoring And Review Console

## Summary

Expand managed content lifecycle sample into a complete content management workflow.

## Goal

Support content creation, drafting, editing, review, publishing, offline, archive, delete, restore, permissioning, and audit history through reusable feature and host surfaces.

## Milestone

- milestone file: none
- slice name: `content cms authoring and review console`

## Priority

- priority: `P0`

## Scope

- In scope:
  - add content authoring form/page flow for supported content models
  - add review queue and reviewer actions for approve/reject/offline/restore
  - add role/permission checks for author, reviewer, admin, and reader access
  - connect upload assets to content attachments and cover images
  - persist audit trail and lifecycle transition history
- Out of scope:
  - full external CMS migration tooling

## Ownership

- owned files:
  - `packages/contracts/src/api/content.ts`
  - `packages/features/feed/src/**`
  - new or existing content feature package under `packages/features/*`
  - `packages/features/media-tools/src/**`
  - `apps/api/src/app.ts`
  - `apps/api/src/store*.ts`
  - `apps/host-h5/src/manifest/page-definitions.ts`
  - `apps/host-wechat/src/manifest/page-definitions.ts`
  - content tests
- allowed generated outputs:
  - regenerated manifests and shells only
- forbidden files:
  - generated host files as source edits

## Dependencies

- depends on:
  - `0089-content-management-lifecycle-surface.md`
  - `0101-upload-object-storage-and-review-completion.md`
  - `0109-form-platform-and-approval-workflow.md`
- blocked by:
  - content model ownership decision if a new feature package is introduced
- integration notes:
  - use scaffolds for new feature/page files instead of ad hoc structure

## Affected Paths

- `packages/contracts/src/api/content.ts`
- `packages/features/feed/src/controller/index.ts`
- `packages/features/media-tools/src/controller/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/data.ts`
- `apps/host-h5/src/manifest/page-definitions.ts`
- `apps/host-wechat/src/manifest/page-definitions.ts`

## Related Specs

- `docs/BACKEND_CONTRACT.md`
- `packages/features/README.md`

## Interface Notes

- contract changes allowed:
  - yes, for authoring fields, review records, roles, audit entries, and attachment references
- store shape changes allowed:
  - yes
- controller action changes allowed:
  - yes
- route param changes allowed:
  - yes, for content id, draft id, review id, and source return

## Verification

- slice gate:
  - content can move through draft, review, publish, offline, archive, delete, and restore via user-visible flows
- generation needed:
  - `pnpm gen:manifests`
  - `pnpm gen:shells` if WeChat pages change
- final verifier handoff:
  - include role and permission matrix

## Acceptance

- [x] content authoring and draft save are implemented
- [x] review queue and reviewer actions are implemented
- [x] lifecycle actions are backed by audit history
- [x] content attachments use uploaded asset references
- [x] reader visibility obeys content lifecycle and access rules
- [x] `pnpm verify` run
