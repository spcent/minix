import assert from "node:assert/strict";
import test from "node:test";

import type { AppKernel } from "@minix/core";

import { authFeatureManifest } from "./feature.manifest";
import { createInitialAuthPageState } from "./model";

function createKernelStub() {
  const toasts: Array<{ title: string; icon: string }> = [];

  const kernel = {
    ui: {
      async toast(options: { title: string; icon: string }) {
        toasts.push(options);
        return { ok: true, value: undefined } as const;
      },
    },
    auth: {
      async login() {
        return {
          ok: false,
          error: {
            code: "AUTH_FAILED",
            message: "login failed",
          },
        } as const;
      },
      async ensureLogin() {
        return { ok: true, value: undefined } as const;
      },
    },
    session: {
      async isLoggedIn() {
        return { ok: true, value: false } as const;
      },
    },
    router: {
      async replaceRoute() {
        return { ok: true, value: undefined } as const;
      },
    },
  } as unknown as AppKernel;

  return {
    kernel,
    toasts,
  };
}

test("auth feature manifest reports login errors through wechat toast mode", async () => {
  const { kernel, toasts } = createKernelStub();
  const controller = authFeatureManifest.createController(
    "wechat",
    kernel,
    {
      successRouteId: "items.list",
      async reportError(authKernel, message) {
        await authKernel.ui.toast({
          title: message,
          icon: "error",
        });
      },
    },
    createInitialAuthPageState(),
  );

  const result = await controller.submitLogin();

  assert.equal(result.ok, false);
  assert.deepEqual(toasts, [{ title: "login failed", icon: "error" }]);
});

test("auth feature manifest keeps h5 login flow free of toast reporting", async () => {
  const { kernel, toasts } = createKernelStub();
  const controller = authFeatureManifest.createController(
    "h5",
    kernel,
    {
      successRouteId: "items.list",
    },
    createInitialAuthPageState(),
  );

  const result = await controller.submitLogin();

  assert.equal(result.ok, false);
  assert.deepEqual(toasts, []);
});
