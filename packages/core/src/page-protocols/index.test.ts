import assert from "node:assert/strict";
import test from "node:test";

import {
  beginFormSubmit,
  createDetailStatus,
  createFormSubmissionKey,
  createDefaultDetailPageState,
  createDefaultFormPageState,
  createDefaultListPageState,
  createDefaultProfilePageState,
  createListStatus,
  finalizeFormSubmit,
  createListPageState,
  createFormWorkflowState,
} from "./index";

test("createListPageState normalizes pagination and selection defaults", () => {
  const state = createListPageState({
    title: "Feed",
    pageSize: 12,
    emptyText: "Nothing to show",
    items: [
      { id: "story-1", title: "Story 1" },
      { id: "story-2", title: "Story 2" },
    ],
    query: {
      keyword: "advisory",
    },
  });

  assert.equal(state.query.page, 1);
  assert.equal(state.query.pageSize, 12);
  assert.equal(state.query.keyword, "advisory");
  assert.equal(state.selectedItemId, "story-1");
  assert.equal(state.items.length, 2);
  assert.equal(state.pagination.page, 1);
  assert.equal(state.pagination.pageSize, 12);
  assert.equal(state.selection.selectedItemIds[0], "story-1");
  assert.equal(state.render.variant, "feed");
  assert.equal(state.render.supportsIncrementalAppend, true);
  assert.equal(state.status.loadState, "idle");
});

test("createListPageState carries render metadata saved filters and batch actions", () => {
  const state = createListPageState({
    title: "Orders",
    pageSize: 20,
    emptyText: "No orders",
    render: {
      variant: "table",
      density: "compact",
      stickyHeaderEnabled: true,
      supportsIncrementalAppend: false,
    },
    savedFilters: [
      {
        key: "paid",
        label: "Paid orders",
        filterKeys: ["status"],
        restored: true,
      },
    ],
    batchActions: [
      {
        key: "mark-read",
        label: "Mark read",
        enabled: true,
        requiresSelection: true,
      },
    ],
  });

  assert.equal(state.render.variant, "table");
  assert.equal(state.render.stickyHeaderEnabled, true);
  assert.equal(state.render.supportsIncrementalAppend, false);
  assert.equal(state.savedFilters[0]?.restored, true);
  assert.equal(state.batchActions[0]?.requiresSelection, true);
});

test("default page protocol factories provide stable baseline state", () => {
  const list = createDefaultListPageState<{ id: string }>({});
  const detail = createDefaultDetailPageState();
  const form = createDefaultFormPageState({
    values: {
      email: "",
    },
  });
  const profile = createDefaultProfilePageState();

  assert.equal(list.title, "List");
  assert.equal(list.query.page, 1);
  assert.equal(list.pagination.hasMore, false);
  assert.equal(list.filters.length, 0);
  assert.equal(list.selection.selectedItemIds.length, 0);
  assert.equal(list.status.loadState, "idle");
  assert.equal(detail.title, "Detail");
  assert.equal(detail.loading, false);
  assert.equal(detail.detailStatus.entryContext, "unknown");
  assert.equal(detail.detailActions.length, 0);
  assert.equal(detail.detailAttachments.length, 0);
  assert.equal(detail.detailComments.length, 0);
  assert.equal(form.title, "Form");
  assert.deepEqual(form.values, { email: "" });
  assert.deepEqual(form.formValues, { email: "" });
  assert.equal(form.validationErrors.length, 0);
  assert.equal(form.submitState.phase, "idle");
  assert.equal(form.workflow.uploadFieldKeys.length, 0);
  assert.equal(profile.title, "Profile");
  assert.equal(profile.selectedActionKey, "open-settings");
  assert.equal(profile.sections[0]?.key, "session");
});

test("createDefaultDetailPageState carries shared extension descriptors", () => {
  const detail = createDefaultDetailPageState({
    title: "Order detail",
    data: {
      id: "order-1",
    },
    entryContext: "share",
    entryEvidence: {
      shareChannel: "wechat_session",
      traceId: "trace-1",
    },
    recovery: {
      title: "Order unavailable",
      message: "Refresh the order detail or return to the order list.",
      actionLabel: "Retry",
      retryable: true,
    },
    actions: [
      {
        key: "refund",
        label: "Refund",
        enabled: false,
        disabledReason: "Refund window has closed",
        placement: "overflow",
      },
    ],
    attachments: [
      {
        key: "invoice",
        label: "Invoice",
        kind: "pdf",
        assetId: "asset-invoice",
        downloadable: true,
      },
    ],
    comments: [
      {
        key: "comment-1",
        authorLabel: "Support",
        body: "Refund review is in progress.",
        status: "visible",
      },
    ],
  });

  assert.equal(detail.detailStatus.loadState, "ready");
  assert.equal(detail.detailStatus.entryContext, "share");
  assert.equal(detail.detailStatus.entryEvidence?.shareChannel, "wechat_session");
  assert.equal(detail.detailStatus.recovery?.retryable, true);
  assert.equal(detail.detailActions[0]?.disabledReason, "Refund window has closed");
  assert.equal(detail.detailAttachments[0]?.downloadable, true);
  assert.equal(detail.detailComments[0]?.authorLabel, "Support");
});

test("form helpers derive conditional visibility and centralize duplicate submit protection", () => {
  const values = {
    type: "event",
    title: "Launch Day",
    publishAt: "2026-04-11",
  };
  const workflow = createFormWorkflowState({
    values,
    schema: {
      fields: [
        { key: "type", label: "Type", type: "single_select" },
        { key: "title", label: "Title", type: "text" },
        {
          key: "cover",
          label: "Cover",
          type: "upload_reference",
          uploadWorkflow: {
            uploadRole: "content-cover",
            acceptedFileTypes: ["image"],
            maxAssets: 1,
            reviewRequired: true,
          },
        },
        {
          key: "publishAt",
          label: "Publish date",
          type: "date",
          conditions: [{ field: "type", operator: "eq", value: "event" }],
        },
      ],
      steps: [{ key: "basics", label: "Basics" }],
    },
    draftPolicy: {
      recoveryKey: "@minix/test/form-draft",
      autoSave: true,
      retentionSeconds: 86400,
    },
    asyncValidation: {
      pendingFieldKeys: ["title"],
      validatedFieldKeys: ["type"],
    },
    approvalTemplates: [
      {
        templateKey: "editorial",
        label: "Editorial review",
        nodeKeys: ["review"],
      },
    ],
  });
  const submissionKey = createFormSubmissionKey("form-test", "submit", values);
  const firstSubmit = beginFormSubmit(
    {
      phase: "idle",
      duplicateProtected: true,
      draftCapable: true,
    },
    {
      mode: "submit",
      submissionKey,
    },
  );
  const finalized = finalizeFormSubmit(firstSubmit.submitState, {
    mode: "submit",
    submissionKey,
    submittedAt: 123,
  });
  const blockedSubmit = beginFormSubmit(finalized, {
    mode: "submit",
    submissionKey,
  });

  assert.deepEqual(workflow.visibleFieldKeys, ["type", "title", "cover", "publishAt"]);
  assert.deepEqual(workflow.uploadFieldKeys, ["cover"]);
  assert.equal(workflow.draftPolicy?.autoSave, true);
  assert.equal(workflow.asyncValidation?.pendingFieldKeys[0], "title");
  assert.equal(workflow.approvalTemplates?.[0]?.templateKey, "editorial");
  assert.equal(firstSubmit.blocked, false);
  assert.equal(blockedSubmit.blocked, true);
  assert.equal(blockedSubmit.submitState.duplicateBlocked, true);
  assert.equal(blockedSubmit.submitState.duplicateEvidence?.submissionKey, submissionKey);
});

test("list and detail status helpers expose route recovery and edge-state metadata", () => {
  const listStatus = createListStatus("skeleton", {
    restoredFromRoute: true,
    restoredQueryKeys: ["keyword", "sort"],
    restoredSelectionId: "story-1",
  });
  const detailStatus = createDetailStatus("stale", {
    entryContext: "deep_link",
    recoveredFromLink: true,
    requestedDetailId: "story-1",
  });
  const unavailableStatus = createDetailStatus("unavailable", {
    entryContext: "share",
  });

  assert.equal(listStatus.skeleton, true);
  assert.equal(listStatus.restoredFromRoute, true);
  assert.deepEqual(listStatus.restoredQueryKeys, ["keyword", "sort"]);
  assert.equal(listStatus.restoredSelectionId, "story-1");
  assert.equal(detailStatus.stale, true);
  assert.equal(detailStatus.recoveredFromLink, true);
  assert.equal(detailStatus.requestedDetailId, "story-1");
  assert.equal(unavailableStatus.unavailable, true);
  assert.equal(unavailableStatus.entryContext, "share");
});
