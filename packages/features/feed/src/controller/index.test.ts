import test from "node:test";
import assert from "node:assert/strict";

import { ok, type AppKernel } from "@minix/core";
import { APP_ROUTE_IDS, type FeedListResponse, type SearchDomain, type SearchMode } from "@minix/contracts";

import { createFeedController } from "./index";
import { createDefaultFeedState } from "../model";

function createKernelStub() {
  const requestCalls: Array<Record<string, unknown>> = [];
  const postCalls: Array<{ path: string; body?: unknown }> = [];
  const routeCalls: Array<{ routeId: string; params?: Record<string, string | number | boolean> }> = [];
  const storageValues = new Map<string, unknown>();
  let requestMode: "success" | "unauthorized" = "success";

  const kernel: AppKernel = {
    env: {
      appId: "test",
      appName: "test",
      apiBaseUrl: "https://mock.minix.local",
      debug: true,
      platform: "h5",
      version: "0.1.0",
    },
    features: {
      enableAutoLogin: false,
      enableRouteGuard: false,
    },
    storage: {
      async get<T>(key: string) {
        return ok((storageValues.get(key) as T | undefined) ?? null);
      },
      async set<T>(key: string, value: T) {
        storageValues.set(key, value);
        return ok(undefined);
      },
      async remove(key: string) {
        storageValues.delete(key);
        return ok(undefined);
      },
      async clear() {
        storageValues.clear();
        return ok(undefined);
      },
    },
    session: {} as AppKernel["session"],
    request: {
      async get<T>(_url: string, query?: Record<string, unknown>) {
        requestCalls.push(query ?? {});
        if (requestMode === "unauthorized") {
          return {
            ok: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Feed session expired",
              recoverable: true,
            },
          } as const;
        }

        const page = Number(query?.page ?? 1);
        const mode: SearchMode =
          query?.mode === "global" || query?.mode === "content" || query?.mode === "user" || query?.mode === "domain"
            ? query.mode
            : "global";
        const domain: SearchDomain =
          query?.domain === "all" || query?.domain === "content" || query?.domain === "user" || query?.domain === "novel" || query?.domain === "feed"
            ? query.domain
            : "feed";
        const searchResponse: FeedListResponse = {
          items:
            mode === "user" || domain === "user"
              ? [
                  {
                    id: "user-mentor",
                    title: "MiniX Mentor",
                    subtitle: "Suggested user",
                    eyebrow: "User",
                    tag: "user",
                    recommendedReason: "Shared relation surface sample result",
                  },
                ]
              : page === 1
              ? [
                  {
                    id: "story-1",
                    title: "Story 1",
                    tag: "news",
                    recommendedReason: "Lead story for the current lane.",
                    contentCard: {
                      contentId: "story-1",
                      model: "article",
                      title: "Story 1",
                      summary: "Lead story summary",
                      authorLabel: "Editorial",
                      display: {
                        category: { key: "news", label: "News" },
                        tags: [{ key: "news", label: "News" }],
                        topics: [{ key: "news", label: "News" }],
                        pinned: true,
                        featured: true,
                      },
                      lifecycle: {
                        state: "draft",
                        availableActions: ["publish", "change_visibility"],
                      },
                    },
                    contentAccess: {
                      visibility: "public",
                      accessible: true,
                      previewAvailable: true,
                      requiresLogin: false,
                      requiresMembership: false,
                      requiresPurchase: false,
                      summaryLabel: "Visible to everyone.",
                    },
                  },
                ]
              : [
                  {
                    id: "story-2",
                    title: "Story 2",
                    tag: "news",
                  },
                ],
          hasMore: page === 1,
          page,
          pageSize: Number(query?.pageSize ?? 12),
          tags: [
            { key: "all", label: "All" },
            { key: "news", label: "News" },
            { key: "user", label: "User" },
          ],
          searchQuery: {
            keyword: typeof query?.keyword === "string" ? query.keyword : "",
            mode,
            domain,
            page,
            pageSize: Number(query?.pageSize ?? 12),
          },
          searchFilters: [
            {
              key: "domain",
              label: "Search domain",
              selectedKeys: domain !== "feed" ? [domain] : [],
              options: [
                { key: "all", label: "All", count: 3 },
                { key: "feed", label: "Feed", count: 2 },
                { key: "user", label: "User", count: 1 },
              ],
            },
          ],
          searchResults: {
            items:
              mode === "user" || domain === "user"
                ? [
                    {
                      id: "user-mentor",
                      title: "MiniX Mentor",
                      subtitle: "Suggested user",
                      eyebrow: "User",
                      tag: "user",
                      recommendedReason: "Shared relation surface sample result",
                    },
                  ]
                : page === 1
                ? [
                    {
                      id: "story-1",
                      title: "Story 1",
                      tag: "news",
                      recommendedReason: "Lead story for the current lane.",
                      contentCard: {
                        contentId: "story-1",
                        model: "article",
                        title: "Story 1",
                        summary: "Lead story summary",
                        authorLabel: "Editorial",
                        display: {
                          category: { key: "news", label: "News" },
                          tags: [{ key: "news", label: "News" }],
                          topics: [{ key: "news", label: "News" }],
                          pinned: true,
                          featured: true,
                        },
                        lifecycle: {
                          state: "draft",
                          availableActions: ["publish", "change_visibility"],
                        },
                      },
                      contentAccess: {
                        visibility: "public",
                        accessible: true,
                        previewAvailable: true,
                        requiresLogin: false,
                        requiresMembership: false,
                        requiresPurchase: false,
                        summaryLabel: "Visible to everyone.",
                      },
                    },
                  ]
                : [
                    {
                      id: "story-2",
                      title: "Story 2",
                      tag: "news",
                    },
                  ],
            total: mode === "user" || domain === "user" ? 1 : 2,
            hasMore: mode === "user" || domain === "user" ? false : page === 1,
            emptyText: "No feed items are available yet.",
            ...(mode === "user" || domain === "user"
              ? { featuredReason: "Shared relation surface sample result" }
              : page === 1
                ? { featuredReason: "Lead story for the current lane." }
                : {}),
            suggestionTerms: ["travel", "review"],
            hotKeywords: ["travel", "review"],
            recentKeywords: [],
            sortOptions: [{ key: "recommended", label: "Recommended" }],
            activeSortKey: "recommended",
            activeDomain: domain,
            domainTabs: [
              { domain: "all", label: "All", total: 3, active: domain === "all" },
              { domain: "feed", label: "Feed", total: 2, active: domain === "feed" },
              { domain: "user", label: "User", total: 1, active: domain === "user" },
            ],
          },
        };
        return ok(searchResponse as T);
      },
      async post<T>(path: string, body?: unknown) {
        postCalls.push({ path, body });
        return ok({
          contentCard: {
            contentId: "story-1",
            model: "article",
            title: "Story 1",
            summary: "Lead story summary",
            authorLabel: "Editorial",
            display: {
              category: { key: "news", label: "News" },
              tags: [{ key: "news", label: "News" }],
              topics: [{ key: "news", label: "News" }],
              pinned: true,
              featured: false,
            },
            lifecycle: {
              state: "published",
              availableActions: ["archive", "delete", "change_visibility"],
            },
          },
          contentDetail: {
            contentId: "story-1",
            model: "article",
            title: "Story 1",
            summary: "Lead story summary",
            authorLabel: "Editorial",
            display: {
              category: { key: "news", label: "News" },
              tags: [{ key: "news", label: "News" }],
              topics: [{ key: "news", label: "News" }],
              pinned: true,
              featured: false,
            },
            lifecycle: {
              state: "published",
              availableActions: ["archive", "delete", "change_visibility"],
            },
            recommendationReason: "Lifecycle status: published.",
          },
          contentAccess: {
            visibility: "member_only",
            accessible: false,
            previewAvailable: true,
            requiresLogin: false,
            requiresMembership: true,
            requiresPurchase: false,
            summaryLabel: "Visible to members only.",
            entitlementLabel: "Membership access",
            gateLabel: "Access is gated by the current visibility rule.",
          },
          transitionMessage: "Content published.",
        } as T);
      },
      async put<T>() {
        return ok({} as T);
      },
      async patch<T>() {
        return ok({} as T);
      },
      async delete<T>() {
        return ok({} as T);
      },
    },
    auth: {} as AppKernel["auth"],
    router: {
      async to() {
        return ok(undefined);
      },
      async replace() {
        return ok(undefined);
      },
      async toRoute(routeId, params) {
        routeCalls.push({ routeId, ...(params ? { params } : {}) });
        return ok(undefined);
      },
      async replaceRoute(routeId, params) {
        routeCalls.push({ routeId, ...(params ? { params } : {}) });
        return ok(undefined);
      },
      resolve() {
        return ok("/feed");
      },
      async back() {
        return ok(undefined);
      },
      current() {
        return ok({ path: "/feed" });
      },
    },
    ui: {} as AppKernel["ui"],
  };

  return {
    kernel,
    requestCalls,
    routeCalls,
    postCalls,
    storageValues,
    setRequestMode(mode: "success" | "unauthorized") {
      requestMode = mode;
    },
  };
}

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
  assert.equal(controller.store.getState().selection.selectedItemIds[0], "story-1");
  assert.equal(controller.store.getState().status.loadState, "ready");
  assert.equal(controller.store.getState().featuredReason, "Lead story for the current lane.");
  assert.equal(controller.store.getState().tags[1]?.key, "news");
  assert.equal(controller.store.getState().searchQuery?.domain, "feed");
  assert.equal(controller.store.getState().searchResults?.total, 2);
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
  assert.equal(controller.store.getState().contentTransitionFeedback, "Content published.");
});
