import { ok, type AppKernel, type BootstrapRuntimeEnvOverride } from "@minix/core";

export function createBaseKernelStub(platform: AppKernel["env"]["platform"]): AppKernel {
  return {
    env: {
      appId: `test-${platform}`,
      appName: `test-${platform}`,
      apiBaseUrl: "https://mock.minix.local",
      debug: true,
      platform,
      version: "1.0.0",
    },
    features: {
      enableAutoLogin: false,
      enableRouteGuard: false,
    },
    storage: {} as AppKernel["storage"],
    session: {
      async get() {
        return ok(null);
      },
      async set() {
        return ok(undefined);
      },
      async clear() {
        return ok(undefined);
      },
      async isLoggedIn() {
        return ok(false);
      },
    },
    request: {} as AppKernel["request"],
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
        return ok("/test-route");
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

export function withBootstrapEnvOverride<TOverride extends BootstrapRuntimeEnvOverride, TResult>(
  override: TOverride | undefined,
  run: () => TResult,
): TResult {
  const globals = globalThis as typeof globalThis & {
    __MINIX_BOOTSTRAP_ENV__: TOverride | undefined;
  };
  const previous = globals.__MINIX_BOOTSTRAP_ENV__;

  try {
    globals.__MINIX_BOOTSTRAP_ENV__ = override;
    return run();
  } finally {
    globals.__MINIX_BOOTSTRAP_ENV__ = previous;
  }
}

export function withBootstrapLocationSearch<TResult>(search: string | undefined, run: () => TResult): TResult {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "location");

  try {
    Object.defineProperty(globalThis, "location", {
      configurable: true,
      value: search === undefined ? undefined : { search },
    });
    return run();
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis, "location", descriptor);
    } else {
      delete (globalThis as typeof globalThis & { location?: unknown }).location;
    }
  }
}
