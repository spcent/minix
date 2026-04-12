import assert from "node:assert/strict";
import test from "node:test";

import { ok, type AppKernel } from "@minix/core";
import { APP_ROUTE_IDS, type FeedListResponse } from "@minix/contracts";

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
        const response: FeedListResponse = {
          items: [
            {
              id: "story-1",
              title: "Story 1",
            },
          ],
          hasMore: false,
          page: 1,
          pageSize: 12,
          searchQuery: {
            keyword: "",
            mode: "global",
            domain: "feed",
            page: 1,
            pageSize: 12,
          },
          searchFilters: [],
          searchResults: {
            items: [
              {
                id: "story-1",
                title: "Story 1",
              },
            ],
            total: 1,
            hasMore: false,
            emptyText: "No feed items are available yet.",
            suggestionTerms: ["travel"],
            hotKeywords: ["travel"],
            recentKeywords: [],
            sortOptions: [{ key: "recommended", label: "Recommended" }],
            activeSortKey: "recommended",
          },
        };
        return ok(response as T);
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
  assert.equal(controller.store.getState().title, "Search Center");
  assert.equal(controller.store.getState().searchQuery?.mode, "global");
});
