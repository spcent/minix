import assert from "node:assert/strict";
import test from "node:test";

import { ok, type AppKernel } from "@minix/core";
import { APP_ROUTE_IDS } from "@minix/contracts";

import { accountFeatureManifest } from "./feature.manifest";
import { createDefaultAccountState } from "./model";

function createKernelStub() {
  const routeCalls: string[] = [];

  const kernel = {
    session: {
      async get() {
        return ok({
          loggedIn: true,
          platform: "h5",
          identity: { userId: "user-1" },
          token: { accessToken: "token-1", expiresAt: Date.now() + 60_000 },
        });
      },
    },
    request: {
      async get<T>() {
        return ok({
          subtitle: "Account workspace",
          stats: [{ key: "projects", label: "Projects", value: "3" }],
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
    },
    capability: {
      status() {
        return ok(true);
      },
      async execute(input: { capability: string; action: string }) {
        return ok({
          capability: input.capability,
          action: input.action,
        });
      },
    },
  } as unknown as AppKernel;

  return {
    kernel,
    routeCalls,
  };
}

test("account feature manifest creates a reusable account controller from host page data", async () => {
  const { kernel, routeCalls } = createKernelStub();
  const controller = accountFeatureManifest.createController(
    "h5",
    kernel,
    {
      loginRouteId: APP_ROUTE_IDS.login,
      settingsRouteId: APP_ROUTE_IDS.settings,
      overviewRouteId: APP_ROUTE_IDS.overview,
    },
    createDefaultAccountState(),
  );

  await controller.loadInitial();
  await controller.goToSettings();

  assert.equal(controller.store.getState().subtitle, "Account workspace");
  assert.equal(controller.store.getState().stats[0]?.label, "Projects");
  assert.deepEqual(routeCalls, [APP_ROUTE_IDS.settings]);
});
