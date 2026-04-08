import test from "node:test";
import assert from "node:assert/strict";

import { ok, type AppKernel } from "@minix/core";
import { APP_ROUTE_IDS } from "@minix/contracts";

import { createMediaToolsController } from "./index";
import { createDefaultMediaToolsState } from "../model";

function createKernelStub() {
  const routeCalls: string[] = [];

  const kernel = {
    capability: {
      status(capability: string) {
        return ok(capability === "upload" || capability === "share");
      },
      async execute(input: { capability: string; action: string }) {
        if (input.capability === "upload") {
          return ok({
            capability: "upload",
            action: input.action,
            value: {
              uploadTask: {
                taskId: "task_1",
                scenario: "content",
                fileType: "image",
                stage: "completed",
                fileName: "cover.png",
                progress: {
                  completedBytes: 100,
                  totalBytes: 100,
                  percentage: 100,
                },
                chunkingReserved: true,
                governance: {
                  maxSizeBytes: 10_000_000,
                  acceptedFileTypes: ["image", "pdf", "attachment"],
                  sensitiveReviewRequired: true,
                  expiresInDays: 30,
                },
                reviewStatus: "pending",
              },
              uploadAsset: {
                assetId: "asset_1",
                fileType: "image",
                fileName: "cover.png",
                url: "https://example.test/assets/cover.png",
                metadata: {
                  sizeBytes: 100,
                },
              },
            },
            detail: "upload reservation selected through h5 capability adapter",
          });
        }

        return ok({
          capability: "share",
          action: input.action,
          value: {
            sharePayload: {
              scenario: "invite",
              title: "Invite a friend to MiniX",
              landingPath: "/inbox",
              landingUrl: "https://example.test/inbox",
              shortLink: "https://mini.x/invite/demo",
              trackingParams: {
                channel: "host-h5",
              },
              channelMarker: "host-h5-demo",
              inviteCode: "MINIX42",
            },
            shareChannel: {
              kind: "copy_link",
              label: "Copy Link",
              executable: true,
              channelMarker: "host-h5-demo",
            },
            shareAttribution: {
              channelMarker: "host-h5-demo",
              inviteBindingEnabled: true,
              returnFlowRecognized: true,
              shareCount: 1,
              clickCount: 0,
              conversionCount: 0,
              lastSharedAt: "2026-04-08T09:40:00.000Z",
            },
          },
          detail: "share dispatch reserved through h5 capability adapter",
        });
      },
    },
    router: {
      async toRoute(routeId: string) {
        routeCalls.push(routeId);
        return ok(undefined);
      },
    },
  } as unknown as AppKernel;

  return {
    kernel,
    routeCalls,
  };
}

test("media-tools controller loads capability availability", () => {
  const { kernel } = createKernelStub();
  const controller = createMediaToolsController({
    kernel,
    initialState: createDefaultMediaToolsState(),
  });

  controller.loadInitial();

  assert.equal(controller.store.getState().ready, true);
  assert.equal(controller.store.getState().uploadAvailable, true);
  assert.equal(controller.store.getState().shareAvailable, true);
});

test("media-tools controller stores upload contract output after the primary action", async () => {
  const { kernel } = createKernelStub();
  const controller = createMediaToolsController({
    kernel,
    initialState: createDefaultMediaToolsState(),
  });

  await controller.startUpload();

  assert.equal(controller.store.getState().uploadTask.stage, "completed");
  assert.equal(controller.store.getState().uploadAsset?.assetId, "asset_1");
  assert.equal(controller.store.getState().lastResult?.status, "succeeded");
});

test("media-tools controller stores share contract output after the secondary action", async () => {
  const { kernel } = createKernelStub();
  const controller = createMediaToolsController({
    kernel,
    initialState: createDefaultMediaToolsState(),
  });

  await controller.startShare();

  assert.equal(controller.store.getState().shareAttribution.shareCount, 1);
  assert.equal(controller.store.getState().lastResult?.detail, "share dispatch reserved through h5 capability adapter");
});

test("media-tools controller can route into settings when configured", async () => {
  const { kernel, routeCalls } = createKernelStub();
  const controller = createMediaToolsController({
    kernel,
    settingsRouteId: APP_ROUTE_IDS.settings,
    initialState: createDefaultMediaToolsState(),
  });

  await controller.goToSettings();

  assert.deepEqual(routeCalls, [APP_ROUTE_IDS.settings]);
});
