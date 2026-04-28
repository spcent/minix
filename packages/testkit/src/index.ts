import {
  createError,
  fail,
  ok,
  type AppKernel,
  type BootstrapRuntimeEnvOverride,
  type Result,
} from "@minix/core";

export interface CreateBaseKernelStubOptions {
  env?: Partial<AppKernel["env"]>;
  features?: Partial<AppKernel["features"]>;
  storage?: Partial<AppKernel["storage"]>;
  session?: Partial<AppKernel["session"]>;
  request?: Partial<AppKernel["request"]>;
  auth?: Partial<AppKernel["auth"]>;
  router?: Partial<AppKernel["router"]>;
  ui?: Partial<AppKernel["ui"]>;
}

export interface RuntimePageKeySurface {
  registry: Record<string, unknown>;
  pages: Record<string, unknown>;
}

function unavailableRequest<T>(method: string): Promise<Result<T>> {
  return Promise.resolve(
    fail(
      createError("PLATFORM_UNSUPPORTED", `test request ${method} is not configured`, {
        recoverable: false,
      }),
    ),
  );
}

export function createBaseKernelStub(
  platform: AppKernel["env"]["platform"],
  options: CreateBaseKernelStubOptions = {},
): AppKernel {
  const env: AppKernel["env"] = {
    appId: `test-${platform}`,
    appName: `test-${platform}`,
    apiBaseUrl: "https://mock.minix.local",
    debug: true,
    platform,
    version: "1.0.0",
    ...options.env,
  };

  const defaultSession = {
    identity: { userId: `${env.appId}-user` },
    loggedIn: true,
    platform: env.platform,
    token: { accessToken: `${env.appId}-access-token` },
  };

  return {
    env,
    features: {
      enableAutoLogin: false,
      enableRouteGuard: false,
      ...options.features,
    },
    storage: {
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
      ...options.storage,
    },
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
      ...options.session,
    },
    request: {
      get<T>() {
        return unavailableRequest<T>("GET");
      },
      post<T>() {
        return unavailableRequest<T>("POST");
      },
      put<T>() {
        return unavailableRequest<T>("PUT");
      },
      patch<T>() {
        return unavailableRequest<T>("PATCH");
      },
      delete<T>() {
        return unavailableRequest<T>("DELETE");
      },
      ...options.request,
    },
    auth: {
      async ensureLogin() {
        return ok(defaultSession);
      },
      async recoverSession() {
        return ok(null);
      },
      async login() {
        return ok(defaultSession);
      },
      async logout() {
        return ok(undefined);
      },
      async exchangeToken() {
        return ok(defaultSession);
      },
      async refreshSession() {
        return ok(defaultSession);
      },
      ...options.auth,
    },
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
      ...options.router,
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
      ...options.ui,
    },
  };
}

function formatPageKeyMismatch(label: string, actual: readonly string[], expected: readonly string[]): string {
  return `${label} keys mismatch: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`;
}

export function assertRuntimePageKeys(runtime: RuntimePageKeySurface, expectedPageKeys: readonly string[]): void {
  const registryKeys = Object.keys(runtime.registry);
  const pageKeys = Object.keys(runtime.pages);

  if (JSON.stringify(registryKeys) !== JSON.stringify(expectedPageKeys)) {
    throw new Error(formatPageKeyMismatch("registry", registryKeys, expectedPageKeys));
  }

  if (JSON.stringify(pageKeys) !== JSON.stringify(expectedPageKeys)) {
    throw new Error(formatPageKeyMismatch("pages", pageKeys, expectedPageKeys));
  }
}

export async function invokeTestEntryAction<TResult = unknown>(
  entry: unknown,
  action: string,
  ...args: unknown[]
): Promise<TResult> {
  const handler = (entry as Record<string, unknown>)[action];
  if (typeof handler !== "function") {
    throw new Error(`entry action "${action}" is not implemented`);
  }

  return (await handler(...args)) as TResult;
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
