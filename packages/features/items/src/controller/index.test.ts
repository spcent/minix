import assert from "node:assert/strict";
import test from "node:test";

import { APP_ROUTE_IDS, type ItemsListResponse } from "@minix/contracts";
import { createCacheService, ok, type AppKernel, type RequestClient, type Result, type StorageAdapter } from "@minix/core";

import { createItemsController } from "./index";
import { createDefaultItemsPageModel } from "../model";

function createInitialItemsModel() {
  return createDefaultItemsPageModel();
}

function createMemoryAdapter(): StorageAdapter {
  const store = new Map<string, unknown>();

  return {
    async get<T>(key: string) {
      return ok((store.get(key) as T | null) ?? null);
    },
    async set<T>(key: string, value: T) {
      store.set(key, value);
      return ok(undefined);
    },
    async remove(key: string) {
      store.delete(key);
      return ok(undefined);
    },
    async clear(namespace?: string) {
      if (!namespace) {
        store.clear();
        return ok(undefined);
      }

      for (const key of store.keys()) {
        if (key.startsWith(`${namespace}:`)) {
          store.delete(key);
        }
      }

      return ok(undefined);
    },
  };
}

function createKernelStub(
  handler: (url: string, query?: Record<string, unknown>) => Result<unknown> | Promise<Result<unknown>>,
): AppKernel {
  const request: RequestClient = {
    async get<T>(url: string, query?: Record<string, unknown>) {
      return (await handler(url, query)) as Result<T>;
    },
    async post() {
      throw new Error("not implemented");
    },
    async put() {
      throw new Error("not implemented");
    },
    async patch() {
      throw new Error("not implemented");
    },
    async delete() {
      throw new Error("not implemented");
    },
  };

  return {
    env: {
      appId: "demo",
      appName: "demo",
      apiBaseUrl: "https://api.example.com",
      debug: true,
      platform: "wechat",
      version: "0.1.0",
    },
    features: {
      enableAutoLogin: false,
      enableRouteGuard: false,
    },
    storage: createCacheService(createMemoryAdapter(), "items-controller-test"),
    session: {} as AppKernel["session"],
    request,
    auth: {} as AppKernel["auth"],
    router: {
      async to() {
        return ok(undefined);
      },
      async replace() {
        return ok(undefined);
      },
      async toRoute() {
        return ok(undefined);
      },
      async replaceRoute() {
        return ok(undefined);
      },
      resolve() {
        return ok("/pages/login/index");
      },
      async back() {
        return ok(undefined);
      },
      current() {
        return ok(null);
      },
    },
    ui: {
      async toast() {
        return ok(undefined);
      },
      async loading() {
        return ok(undefined);
      },
      async modal() {
        return ok(true);
      },
    },
  };
}

test("items controller loads protected items into the model", async () => {
  let receivedQuery: Record<string, unknown> | undefined;
  const kernel = createKernelStub((url, query) => {
    assert.equal(url, "/items");
    receivedQuery = query;
    return ok<ItemsListResponse<{ id: string; title: string }>>({
      items: [{ id: "item_1", title: "First item" }],
      page: 1,
      pageSize: 20,
      hasMore: true,
    });
  });

  const controller = createItemsController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    settingsRouteId: APP_ROUTE_IDS.settings,
    initialModel: createInitialItemsModel(),
  });
  const result = await controller.loadInitial();

  assert.equal(result?.ok, true);
  assert.deepEqual(receivedQuery, { page: 1, pageSize: 20 });
  assert.deepEqual(controller.store.getState().items, [{ id: "item_1", title: "First item", completed: false }]);
  assert.equal(controller.store.getState().hasMore, true);
  assert.equal(controller.store.getState().progressHydrated, true);
});

test("items controller redirects to login on unauthorized response", async () => {
  const routerCalls: string[] = [];
  const kernel = {
    ...createKernelStub(() => ({
      ok: false as const,
      error: {
        code: "UNAUTHORIZED",
        message: "expired",
        recoverable: true,
      },
    })),
    router: {
      async to(path: string) {
        routerCalls.push(`to:${path}`);
        return ok(undefined);
      },
      async replace(path: string) {
        routerCalls.push(`replace:${path}`);
        return ok(undefined);
      },
      async toRoute(routeId: string) {
        routerCalls.push(`toRoute:${routeId}`);
        return ok(undefined);
      },
      async replaceRoute(routeId: string, params?: Record<string, string | number | boolean>) {
        routerCalls.push(`replaceRoute:${routeId}:${JSON.stringify(params ?? null)}`);
        return ok(undefined);
      },
      resolve(routeId: string) {
        return ok(routeId);
      },
      async back() {
        return ok(undefined);
      },
      current() {
        return ok(null);
      },
    },
  } as AppKernel;

  const controller = createItemsController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    settingsRouteId: APP_ROUTE_IDS.settings,
    authRedirectSource: "plan",
    initialModel: createInitialItemsModel(),
  });

  await controller.loadInitial();

  assert.deepEqual(routerCalls, ['replaceRoute:auth.login:{"from":"plan","reason":"auth-required"}']);
});

test("items controller persists completion state and filter in storage-backed store", async () => {
  const kernel = createKernelStub(() =>
    ok<ItemsListResponse<{ id: string; title: string }>>({
      items: [
        { id: "item_1", title: "Travel Vocabulary" },
        { id: "item_2", title: "Listening Practice" },
      ],
      page: 1,
      pageSize: 20,
      hasMore: false,
    }),
  );

  const controller = createItemsController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    settingsRouteId: APP_ROUTE_IDS.settings,
    initialModel: createInitialItemsModel(),
  });

  await controller.loadInitial();
  await controller.toggleItemCompletion("item_1");
  await controller.setFilter("completed");

  assert.deepEqual(controller.store.getState().completedItemIds, ["item_1"]);
  assert.equal(controller.store.getState().activeFilter, "completed");
  assert.equal(controller.store.getState().items[0]?.completed, true);

  const restored = createItemsController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    settingsRouteId: APP_ROUTE_IDS.settings,
    initialModel: createInitialItemsModel(),
  });

  await restored.hydrateProgress();

  assert.deepEqual(restored.store.getState().completedItemIds, ["item_1"]);
  assert.equal(restored.store.getState().activeFilter, "completed");
});

test("items controller can mark all items complete and clear saved progress", async () => {
  const kernel = createKernelStub(() =>
    ok<ItemsListResponse<{ id: string; title: string }>>({
      items: [
        { id: "item_1", title: "Travel Vocabulary" },
        { id: "item_2", title: "Listening Practice" },
      ],
      page: 1,
      pageSize: 20,
      hasMore: false,
    }),
  );

  const controller = createItemsController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    settingsRouteId: APP_ROUTE_IDS.settings,
    initialModel: createInitialItemsModel(),
  });

  await controller.loadInitial();
  await controller.markItemsComplete(["item_1", "item_2"]);

  assert.equal(controller.store.getState().items.every((item) => item.completed), true);

  await controller.clearProgress();

  assert.deepEqual(controller.store.getState().completedItemIds, []);
  assert.equal(controller.store.getState().activeFilter, "all");
  assert.equal(controller.store.getState().items.every((item) => item.completed === false), true);
});

test("items controller can select a task and complete it while advancing to the next one", async () => {
  const kernel = createKernelStub(() =>
    ok<ItemsListResponse<{ id: string; title: string }>>({
      items: [
        { id: "item_1", title: "Warm-up Vocabulary" },
        { id: "item_2", title: "Input Dialogue" },
        { id: "item_3", title: "Guided Practice" },
      ],
      page: 1,
      pageSize: 20,
      hasMore: false,
    }),
  );

  const controller = createItemsController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    settingsRouteId: APP_ROUTE_IDS.settings,
    initialModel: createInitialItemsModel(),
  });

  await controller.loadInitial();
  assert.equal(controller.store.getState().selectedItemId, "item_1");

  controller.setSelectedItem("item_2");
  assert.equal(controller.store.getState().selectedItemId, "item_2");

  await controller.completeItemAndContinue("item_2");

  assert.deepEqual(controller.store.getState().completedItemIds, ["item_2"]);
  assert.equal(controller.store.getState().selectedItemId, "item_3");
  assert.equal(controller.store.getState().items[1]?.completed, true);
});

test("items controller can route to overview and plan when configured", async () => {
  const routerCalls: string[] = [];
  const kernel = {
    ...createKernelStub(() =>
      ok<ItemsListResponse<{ id: string; title: string }>>({
        items: [],
        page: 1,
        pageSize: 20,
        hasMore: false,
      }),
    ),
    router: {
      async to() {
        return ok(undefined);
      },
      async replace() {
        return ok(undefined);
      },
      async toRoute(routeId: string) {
        routerCalls.push(routeId);
        return ok(undefined);
      },
      async replaceRoute() {
        return ok(undefined);
      },
      resolve() {
        return ok("/pages/login/index");
      },
      async back() {
        return ok(undefined);
      },
      current() {
        return ok(null);
      },
    },
  } as AppKernel;

  const controller = createItemsController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    overviewRouteId: APP_ROUTE_IDS.overview,
    planRouteId: APP_ROUTE_IDS.items,
    settingsRouteId: APP_ROUTE_IDS.settings,
    initialModel: createInitialItemsModel(),
  });

  await controller.goToOverview();
  await controller.goToPlan();

  assert.deepEqual(routerCalls, ["overview.index", "items.list"]);
});
