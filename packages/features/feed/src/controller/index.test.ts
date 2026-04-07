import test from "node:test";
import assert from "node:assert/strict";

import { ok, type AppKernel } from "@minix/core";
import { APP_ROUTE_IDS } from "@minix/contracts";

import { createFeedController } from "./index";
import { createDefaultFeedState } from "../model";

function createKernelStub() {
  const requestCalls: Array<Record<string, unknown>> = [];
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
        return ok({
          items:
            page === 1
              ? [
                  {
                    id: "story-1",
                    title: "Story 1",
                    tag: "news",
                    recommendedReason: "Lead story for the current lane.",
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
          ],
        } as T);
      },
      async post<T>() {
        return ok({} as T);
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
  assert.equal(controller.store.getState().featuredReason, "Lead story for the current lane.");
  assert.equal(controller.store.getState().tags[1]?.key, "news");
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
