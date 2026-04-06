import assert from "node:assert/strict";
import test from "node:test";

import { createCacheService, ok, type AppKernel, type StorageAdapter } from "@minix/core";

import { itemsFeatureManifest } from "./feature.manifest";
import { createItemsPageModel } from "./model";

function createKernelStub() {
  const storageAdapter: StorageAdapter = {
    async get() {
      return ok(null);
    },
    async set() {
      return ok(undefined);
    },
    async remove() {
      return ok(undefined);
    },
    async clear() {
      return ok(undefined);
    },
  };

  return {
    storage: createCacheService(storageAdapter, "items-feature-manifest-test"),
    request: {
      async get() {
        return {
          ok: true,
          value: {
            items: [
              {
                id: "item-1",
                title: "Item 1",
              },
            ],
            hasMore: false,
            page: 1,
            pageSize: 20,
          },
        } as const;
      },
    },
    router: {
      async toRoute() {
        return { ok: true, value: undefined } as const;
      },
      async replaceRoute() {
        return { ok: true, value: undefined } as const;
      },
    },
  } as unknown as AppKernel;
}

test("items feature manifest wires host entry actions by platform", () => {
  assert.ok("onPullDownRefresh" in itemsFeatureManifest.hosts.wechat.entryActions);
  assert.ok(!("onPullDownRefresh" in itemsFeatureManifest.hosts.h5.entryActions));
});

test("items feature manifest creates a controller from host page data", async () => {
  const controller = itemsFeatureManifest.createController(
    "h5",
    createKernelStub(),
    {
      loginRouteId: "auth.login",
      settingsRouteId: "settings.index",
    },
    createItemsPageModel({
      title: "Items",
      pageSize: 20,
      emptyText: "No items yet",
    }),
  );

  await controller.loadInitial();

  assert.equal(controller.store.getState().items.length, 1);
  assert.equal(controller.store.getState().title, "Items");
});
