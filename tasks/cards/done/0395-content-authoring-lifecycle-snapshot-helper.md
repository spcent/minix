# Content Authoring Lifecycle Snapshot Helper

Status: done

## Summary

Add reusable managed-content authoring and lifecycle snapshot helpers.

## Goal

Authoring drafts and lifecycle snapshots should centralize optional field handling, array cloning, and facet cloning for reuse across product surfaces.

## Scope

- In scope:
  - add `cloneManagedContentLifecycle`
  - add `cloneManagedContentAuthoring`
  - cover optional field preservation and nested clone isolation
- Out of scope:
  - changing lifecycle transitions
  - changing authoring contracts

## Ownership

- owned files:
  - `apps/api/src/domains/content/snapshots.ts`
  - `apps/api/src/domains/content/snapshots.test.ts`
  - this task card
- allowed generated outputs: none
- forbidden files:
  - generated host manifests or WeChat shell outputs

## Verification

- slice gate: `pnpm verify:api`

## Acceptance

- [x] lifecycle helper clones available actions
- [x] authoring helper clones category and tags
- [x] authoring attachment ids are not shared
- [x] `pnpm verify:api` run for this code slice

## Completion Notes

- Added lifecycle and authoring snapshot helpers to the content snapshot module.
- Preserved exact optional fields while cloning lifecycle actions, facets, tags, and attachment asset ids.
- Covered nested clone isolation in API domain tests.
