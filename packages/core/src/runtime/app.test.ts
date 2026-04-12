import assert from "node:assert/strict";
import test from "node:test";

import { ok } from "../error/index";
import type {
  AuthAdapter,
  CapabilityAdapter,
  ConfigAdapter,
  LifecycleAdapter,
  RequestAdapter,
  ResponseData,
  RouterAdapter,
  StorageAdapter,
  TelemetryAdapter,
  UIAdapter,
} from "../ports/index";

import { createAppKernel } from "./app";

test("createAppKernel preserves optional platform adapters on the kernel surface", () => {
  const request: RequestAdapter = {
    async request<T>() {
      return ok({
        status: 200,
        headers: {},
        data: undefined as T,
      } satisfies ResponseData<T>);
    },
  };
  const storage: StorageAdapter = {
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
  const auth: AuthAdapter = {
    async login() {
      return ok({
        platform: "h5",
        credential: { anonymousId: "stub-user" },
      });
    },
  };
  const router: RouterAdapter = {
    async push() {
      return ok(undefined);
    },
    async replace() {
      return ok(undefined);
    },
    async back() {
      return ok(undefined);
    },
    current() {
      return ok(null);
    },
  };
  const ui: UIAdapter = {
    async toast() {
      return ok(undefined);
    },
    async loading() {
      return ok(undefined);
    },
    async modal() {
      return ok(true);
    },
  };
  const capability: CapabilityAdapter = {
    status(capability) {
      return ok({
        capability,
        available: true,
        mode: "native",
        detail: "Capability is available.",
      });
    },
    async execute() {
      return ok({
        capability: "device",
        action: "getInfo",
      });
    },
  };
  const config: ConfigAdapter = {
    get() {
      return ok(null);
    },
    getFeatureConfig() {
      return ok(null);
    },
  };
  const lifecycle: LifecycleAdapter = {
    async dispatch() {
      return ok(undefined);
    },
    subscribe() {
      return ok({
        unsubscribe() {},
      });
    },
  };
  const telemetry: TelemetryAdapter = {
    async event() {
      return ok(undefined);
    },
    async error() {
      return ok(undefined);
    },
    async span() {
      return ok(undefined);
    },
  };

  const kernel = createAppKernel({
    env: {
      appId: "test-app",
      appName: "Test App",
      apiBaseUrl: "https://mock.minix.local",
      debug: true,
      platform: "h5",
      version: "1.0.0",
    },
    features: {
      enableAutoLogin: false,
      enableRouteGuard: false,
    },
    adapters: {
      request,
      storage,
      auth,
      router,
      ui,
      capability,
      config,
      lifecycle,
      telemetry,
    },
  });

  assert.equal(kernel.capability, capability);
  assert.equal(kernel.config, config);
  assert.equal(kernel.lifecycle, lifecycle);
  assert.equal(kernel.telemetry, telemetry);
});
