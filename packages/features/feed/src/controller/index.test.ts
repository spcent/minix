import test from "node:test";
import assert from "node:assert/strict";

import { APP_ROUTE_IDS } from "@minix/contracts";

import { createFeedController } from "./index";
import { createKernelStub } from "./test-kernel";
import { createDefaultFeedState } from "../model";

test("feed controller loads feed items and derives the featured reason", async () => {
  const { kernel } = createKernelStub();
  const controller = createFeedController({
    kernel,
    initialState: createDefaultFeedState(),
  });

  await controller.loadInitial();

  assert.equal(controller.store.getState().ready, true);
  assert.equal(controller.store.getState().items.length, 1);
  assert.equal(controller.store.getState().selectedItemId, "story-1");
  assert.equal(controller.store.getState().pagination.page, 1);
  assert.equal(controller.store.getState().filters[0]?.key, "domain");
  assert.equal(controller.store.getState().filters[1]?.key, "tag");
  assert.equal(controller.store.getState().selection.selectedItemIds[0], "story-1");
  assert.equal(controller.store.getState().status.loadState, "ready");
  assert.equal(controller.store.getState().featuredReason, "Lead story for the current lane.");
  assert.equal(controller.store.getState().tags[1]?.key, "news");
  assert.equal(controller.store.getState().searchQuery?.domain, "feed");
  assert.equal(controller.store.getState().searchResults?.total, 2);
  assert.equal(controller.store.getState().searchResults?.activeDomain, "feed");
  assert.equal(controller.store.getState().searchResults?.resultGroups?.[0]?.domain, "feed");
  assert.equal(controller.store.getState().searchFilters[0]?.persistenceScope, "route");
  assert.equal(controller.store.getState().searchResults?.grouping?.strategy, "flat");
  assert.equal(controller.store.getState().searchResults?.zeroResultGuidance?.state, "results");
  assert.equal(controller.store.getState().searchResults?.persistence?.routeWriteback, false);
});

test("feed controller submits keyword searches and persists recent keywords", async () => {
  const { kernel, requestCalls, routeCalls, storageValues } = createKernelStub();
  const controller = createFeedController({
    kernel,
    feedRouteId: APP_ROUTE_IDS.items,
    initialState: createDefaultFeedState(),
  });

  controller.setKeyword("advisory");
  await controller.submitSearch();

  assert.equal(controller.store.getState().query.keyword, "advisory");
  assert.equal((requestCalls.at(-1) as Record<string, unknown>)?.keyword, "advisory");
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.items,
    params: {
      keyword: "advisory",
    },
  });
  assert.deepEqual(storageValues.get("feed.recent-keywords"), ["advisory"]);
  assert.equal(controller.store.getState().searchResults?.persistence?.routeWriteback, true);
  assert.equal(controller.store.getState().searchResults?.persistence?.recentKeywordCount, 1);
  assert.match(controller.store.getState().searchQualitySummary?.recentSearchSummary ?? "", /1 recent keyword/);
  assert.match(controller.store.getState().searchQualitySummary?.routeWritebackSummary ?? "", /keyword/);
});

test("feed controller can switch into the shared user-search scope and persist route params", async () => {
  const { kernel, requestCalls, routeCalls } = createKernelStub();
  const controller = createFeedController({
    kernel,
    feedRouteId: APP_ROUTE_IDS.items,
    initialState: createDefaultFeedState(),
  });

  await controller.applySearchScope({
    mode: "user",
    domain: "user",
  });

  assert.equal((requestCalls.at(-1) as Record<string, unknown>)?.mode, "user");
  assert.equal((requestCalls.at(-1) as Record<string, unknown>)?.domain, "user");
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.items,
    params: {
      mode: "user",
      domain: "user",
    },
  });
  assert.equal(controller.store.getState().searchQuery?.mode, "user");
  assert.equal(controller.store.getState().searchQuery?.domain, "user");
  assert.equal(controller.store.getState().items[0]?.eyebrow, "User");
});

test("feed controller restores route params and can apply sort plus typo recovery", async () => {
  const { kernel, requestCalls, routeCalls, storageValues, setCurrentRoute } = createKernelStub();
  setCurrentRoute({
    path: "/discover",
    params: {
      keyword: "travle",
      sort: "updatedAt",
    },
  });
  const controller = createFeedController({
    kernel,
    feedRouteId: APP_ROUTE_IDS.feed,
    initialState: createDefaultFeedState(),
  });

  await controller.loadInitial();

  assert.equal(controller.store.getState().query.keyword, "travle");
  assert.equal(controller.store.getState().query.sortKey, "updatedAt");
  assert.equal(controller.store.getState().searchResults?.correctionKeyword, "travel");
  assert.equal(controller.store.getState().searchResults?.zeroResultGuidance?.state, "corrected");
  assert.equal(controller.store.getState().searchResults?.persistence?.reloadRecovery, "route");
  assert.match(controller.store.getState().searchQualitySummary?.correctionSummary ?? "", /travel/);

  await controller.applyCorrectionTerm();

  assert.equal((requestCalls.at(-1) as Record<string, unknown>)?.keyword, "travel");
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.feed,
    params: {
      keyword: "travel",
      sort: "updatedAt",
    },
  });
  assert.deepEqual(storageValues.get("feed.recent-keywords"), ["travel"]);

  await controller.applySearchSort("popular");

  assert.equal((requestCalls.at(-1) as Record<string, unknown>)?.sort, "popular");
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.feed,
    params: {
      keyword: "travel",
      sort: "popular",
      selectedItemId: "story-1",
    },
  });
});

test("feed controller can load the next page and append results", async () => {
  const { kernel } = createKernelStub();
  const controller = createFeedController({
    kernel,
    initialState: createDefaultFeedState(),
  });

  await controller.loadInitial();
  await controller.loadMore();

  assert.equal(controller.store.getState().items.length, 2);
  assert.equal(controller.store.getState().items[1]?.id, "story-2");
  assert.equal(controller.store.getState().query.page, 2);
  assert.equal(controller.store.getState().pagination.page, 2);
  assert.equal(controller.store.getState().status.loadState, "ready");
});

test("feed controller restores route query and selected item state", async () => {
  const { kernel, setCurrentRoute } = createKernelStub();
  setCurrentRoute({
    path: "/feed",
    params: {
      keyword: "travel",
      tag: "news",
      mode: "user",
      domain: "user",
      sort: "updatedAt",
      selectedItemId: "user-mentor",
    },
  });

  const controller = createFeedController({
    kernel,
    feedRouteId: APP_ROUTE_IDS.feed,
    initialState: createDefaultFeedState(),
  });

  await controller.loadInitial();

  assert.equal(controller.store.getState().status.restoredFromRoute, true);
  assert.deepEqual(controller.store.getState().status.restoredQueryKeys, ["keyword", "tag", "mode", "domain", "sort"]);
  assert.equal(controller.store.getState().status.restoredSelectionId, "user-mentor");
  assert.equal(controller.store.getState().query.keyword, "travel");
  assert.equal(controller.store.getState().query.mode, "user");
  assert.equal(controller.store.getState().query.domain, "user");
  assert.equal(controller.store.getState().selectedItemId, "user-mentor");
  assert.deepEqual(controller.store.getState().searchResults?.persistence?.routeKeys, ["keyword", "mode", "domain", "sort", "tag"]);
});

test("feed controller restores recent keyword reuse posture from storage", async () => {
  const { kernel, storageValues } = createKernelStub();
  storageValues.set("feed.recent-keywords", ["travel", "review"]);

  const controller = createFeedController({
    kernel,
    feedRouteId: APP_ROUTE_IDS.feed,
    initialState: createDefaultFeedState(),
  });

  await controller.loadInitial();

  assert.deepEqual(controller.store.getState().recentKeywords, ["travel", "review"]);
  assert.equal(controller.store.getState().searchResults?.persistence?.reloadRecovery, "storage");
  assert.equal(controller.store.getState().searchResults?.persistence?.recentKeywordCount, 2);
});

test("feed controller routes unauthorized responses back to login", async () => {
  const { kernel, routeCalls, setRequestMode } = createKernelStub();
  setRequestMode("unauthorized");
  const controller = createFeedController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    initialState: createDefaultFeedState(),
  });

  const result = await controller.loadInitial();

  assert.equal(result.ok, false);
  assert.equal(controller.store.getState().errorText, "Feed session expired");
  assert.equal(controller.store.getState().status.loadState, "error");
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.login,
    params: {
      redirectPath: "/feed",
      redirectSource: "feed",
      redirectReason: "auth-required",
    },
  });
});

test("feed controller can open the selected item and route into settings", async () => {
  const { kernel, routeCalls } = createKernelStub();
  const controller = createFeedController({
    kernel,
    detailRouteId: APP_ROUTE_IDS.overview,
    settingsRouteId: APP_ROUTE_IDS.settings,
    initialState: createDefaultFeedState(),
  });

  await controller.loadInitial();
  await controller.openItem();
  await controller.goToSettings();

  assert.deepEqual(routeCalls, [
    {
      routeId: APP_ROUTE_IDS.overview,
      params: {
        id: "story-1",
      },
    },
    {
      routeId: APP_ROUTE_IDS.settings,
    },
  ]);
});

test("feed controller opens user search results through route targets", async () => {
  const { kernel, routeCalls } = createKernelStub();
  const controller = createFeedController({
    kernel,
    feedRouteId: APP_ROUTE_IDS.feed,
    detailRouteId: APP_ROUTE_IDS.overview,
    initialState: createDefaultFeedState(),
  });

  await controller.applySearchFilter("domain", ["user"]);
  await controller.openItem();

  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.account,
    params: {
      targetUserId: "user-mentor",
    },
  });
});

test("feed controller can apply managed content lifecycle actions on the selected item", async () => {
  const { kernel, postCalls } = createKernelStub();
  const controller = createFeedController({
    kernel,
    initialState: createDefaultFeedState(),
  });

  await controller.loadInitial();
  await controller.applyContentLifecycleAction("publish", {
    visibility: "member_only",
  });

  assert.equal(postCalls[0]?.path, "/content/lifecycle");
  assert.deepEqual(postCalls[0]?.body, {
    contentId: "story-1",
    action: "publish",
    visibility: "member_only",
  });
  assert.equal(controller.store.getState().items[0]?.contentCard?.lifecycle.state, "published");
  assert.equal(controller.store.getState().items[0]?.contentAccess?.visibility, "member_only");
  assert.equal(controller.store.getState().items[0]?.eyebrow, "News");
  assert.equal(
    controller.store.getState().searchResults?.resultGroups?.[0]?.items.find((item) => item.id === "story-1")?.contentCard?.lifecycle.state,
    "published",
  );
  assert.equal(controller.store.getState().contentTransitionFeedback, "Content published.");
});

test("feed controller can save a managed content draft with attachment references", async () => {
  const { kernel, postCalls } = createKernelStub();
  const controller = createFeedController({
    kernel,
    initialState: createDefaultFeedState(),
  });

  await controller.loadInitial();
  await controller.saveContentDraft({
    contentId: "story-1",
    model: "article",
    title: "Story 1 Draft",
    subtitle: "Saved draft",
    summary: "Draft summary",
    bodyPreview: "Draft body preview",
    visibility: "login_required",
    categoryKey: "news",
    categoryLabel: "News",
    tags: [{ key: "news", label: "News" }],
    coverAssetId: "asset-cover",
    attachmentAssetIds: ["asset-attachment-1"],
    actorRole: "author",
  });

  assert.equal(postCalls.at(-1)?.path, "/content/save-draft");
  assert.equal(controller.store.getState().items[0]?.contentCard?.lifecycle.state, "draft");
  assert.equal(controller.store.getState().items[0]?.contentCard?.coverUrl, "https://mock.minix.local/uploads/assets/asset-cover");
  assert.equal(controller.store.getState().items[0]?.imageUrl, "https://mock.minix.local/uploads/assets/asset-cover");
  assert.equal(controller.store.getState().items[0]?.eyebrow, "News");
  assert.equal(
    controller.store.getState().searchResults?.resultGroups?.[0]?.items.find((item) => item.id === "story-1")?.contentCard?.coverUrl,
    "https://mock.minix.local/uploads/assets/asset-cover",
  );
  assert.equal(controller.store.getState().contentTransitionFeedback, "Content draft saved.");
});

test("feed controller exposes a schema-driven content draft form with snapshot recovery", async () => {
  const { kernel, storageValues } = createKernelStub();
  const controller = createFeedController({
    kernel,
    initialState: createDefaultFeedState(),
  });

  await controller.loadInitial();
  controller.updateContentDraftValues({
    model: "event",
    title: "Launch Event",
    summary: "Draft summary",
    bodyPreview: "Rich draft body",
    tagKeys: ["event", "featured"],
    publishAt: "2026-05-01",
    coverAssetId: "asset-cover",
    attachmentAssetIds: ["asset-attachment-1"],
  });
  controller.setContentDraftStep("distribution");
  await controller.saveContentDraftSnapshot();

  const restoredController = createFeedController({
    kernel,
    initialState: createDefaultFeedState(),
  });
  await restoredController.loadInitial();

  assert.equal(storageValues.has("@minix/feed/content-draft/v1"), true);
  assert.equal(restoredController.store.getState().contentDraftForm.values.model, "event");
  assert.equal(restoredController.store.getState().contentDraftForm.workflow.currentStepKey, "distribution");
  assert.equal(
    restoredController.store.getState().contentDraftForm.schema.fields.some((field) => field.type === "date"),
    true,
  );
  assert.equal(
    restoredController.store.getState().contentDraftForm.schema.fields.some((field) => field.type === "multi_select"),
    true,
  );
  assert.equal(
    restoredController.store.getState().contentDraftForm.schema.fields.some((field) => field.type === "upload_reference"),
    true,
  );
  assert.equal(
    restoredController.store.getState().contentDraftForm.schema.fields.some((field) => field.type === "rich_text"),
    true,
  );
});

test("feed controller can load the content review queue", async () => {
  const { kernel } = createKernelStub();
  const controller = createFeedController({
    kernel,
    initialState: createDefaultFeedState(),
  });

  await controller.loadReviewQueue({
    actorRole: "reviewer",
    state: "under_review",
  });

  assert.equal(controller.store.getState().reviewQueue.length, 1);
  assert.equal(controller.store.getState().reviewQueue[0]?.contentId, "story-1");
  assert.equal(controller.store.getState().reviewQueue[0]?.moderationSummary?.includes("queued"), true);
  assert.equal(controller.store.getState().selectedReviewContentId, "story-1");
  assert.match(controller.store.getState().contentGovernanceSummary?.attachmentGovernanceSummary ?? "", /2 attachment/);
  assert.equal(controller.store.getState().contentDraftForm.workflow.approvalNodes?.[1]?.assigneeLabel, "Reviewer Mina");
});
