import assert from "node:assert/strict";
import test from "node:test";

import type { AppKernel } from "@minix/core";

import { settingsFeatureManifest } from "./feature.manifest";
import { createSettingsPageModel } from "./model";

function createKernelStub() {
  const replaceCalls: string[] = [];

  const kernel = {
    auth: {
      async logout() {
        return { ok: true, value: undefined } as const;
      },
    },
    router: {
      async replaceRoute(routeId: string) {
        replaceCalls.push(routeId);
        return { ok: true, value: undefined } as const;
      },
    },
    ui: {
      async toast() {
        return { ok: true, value: undefined } as const;
      },
      async modal() {
        return { ok: true, value: true } as const;
      },
    },
  } as unknown as AppKernel;

  return {
    kernel,
    replaceCalls,
  };
}

test("settings feature manifest creates a logout controller from host page data", async () => {
  const { kernel, replaceCalls } = createKernelStub();
  const controller = settingsFeatureManifest.createController(
    "wechat",
    kernel,
    {
      loginRouteId: "auth.login",
      itemsRouteId: "items.list",
      overviewRouteId: "overview.index",
      showErrorToast: true,
    },
    createSettingsPageModel({
      title: "Settings",
      sectionKey: "account",
      logoutLabel: "Logout",
      logoutValue: "Sign out",
    }),
  );

  const result = await controller.logout();

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.deepEqual(replaceCalls, ["auth.login"]);
});
