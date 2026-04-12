import assert from "node:assert/strict";
import test from "node:test";

import { ok, type AppKernel } from "@minix/core";
import { APP_ROUTE_IDS, type FeedbackBootstrapResponse } from "@minix/contracts";

import { feedbackFeatureManifest } from "./feature.manifest";
import { createDefaultFeedbackState } from "./model";

function createKernelStub() {
  return {
    capability: {
      status(capability: "clipboard" | "device" | "location" | "payment" | "share" | "subscription" | "upload") {
        return ok({
          capability,
          available: false,
          mode: "unavailable",
          detail: "Capability is unavailable.",
        });
      },
      async execute() {
        return ok({
          capability: "device",
          action: "getInfo",
          value: {},
        });
      },
    },
    session: {
      async get() {
        return ok(null);
      },
    },
    request: {
      async get<T>() {
        const response: FeedbackBootstrapResponse = {
          feedbackCategories: [
            {
              key: "product_issue",
              label: "Product Issue",
              type: "issue_report",
              defaultPriority: "high",
              labels: ["product", "bug"],
              supportsAttachments: true,
            },
          ],
        };
        return ok(response as T);
      },
    },
    router: {
      current() {
        return ok({ path: "/feedback" });
      },
      async toRoute() {
        return ok(undefined);
      },
      async replaceRoute() {
        return ok(undefined);
      },
    },
  } as unknown as AppKernel;
}

test("feedback feature manifest creates a reusable form controller from host page data", async () => {
  const controller = feedbackFeatureManifest.createController(
    "h5",
    createKernelStub(),
    {
      feedbackRouteId: APP_ROUTE_IDS.feedback,
    },
    createDefaultFeedbackState(),
  );

  await controller.loadInitial();

  assert.equal(controller.store.getState().ready, true);
  assert.equal(controller.store.getState().categories[0]?.key, "product_issue");
});
