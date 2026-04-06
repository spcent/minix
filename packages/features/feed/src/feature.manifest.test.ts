import assert from "node:assert/strict";
import test from "node:test";

import { ok, type AppKernel } from "@minix/core";
import { APP_ROUTE_IDS } from "@minix/contracts";

import { feedFeatureManifest } from "./feature.manifest";
import { createDefaultFeedState } from "./model";

function createKernelStub() {
  const routeCalls: string[] = [];

  const kernel = {
    storage: {
      async get() {
        return ok(null);
      },
      async set() {
        return ok(undefined);
      },
    },
    request: {
      async get<T>() {
        return ok({
          items: [
            {
              id: "story-1",
              title: "Story 1",
            },
          ],
          hasMore: false,
          page: 1,
          pageSize: 12,
        } as T);
      },
    },
    router: {
      async toRoute(routeId: string) {
        routeCalls.push(routeId);
        return ok(undefined);
      },
      async replaceRoute(routeId: string) {
        routeCalls.push(routeId);
        return ok(undefined);
      },
      current() {
        return ok({ path: "/feed" });
      },
    },
  } as unknown as AppKernel;

  return {
    kernel,
    routeCalls,
  };
}

test("feed feature manifest wires host entry actions by platform", () => {
  assert.ok("onPullDownRefresh" in feedFeatureManifest.hosts.wechat.entryActions);
  assert.ok(!("onPullDownRefresh" in feedFeatureManifest.hosts.h5.entryActions));
});

test("feed feature manifest creates a reusable feed controller from host page data", async () => {
  const controller = feedFeatureManifest.createController(
    "h5",
    createKernelStub().kernel,
    {
      detailRouteId: APP_ROUTE_IDS.overview,
    },
    createDefaultFeedState(),
  );

  await controller.loadInitial();

  assert.equal(controller.store.getState().items.length, 1);
  assert.equal(controller.store.getState().title, "Feed");
});
