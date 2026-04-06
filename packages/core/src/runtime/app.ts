import { createCacheService } from "../store/cache";
import type { CacheService } from "../store/cache";
import type { AuthAdapter, RequestAdapter, RouterAdapter, StorageAdapter, UIAdapter } from "../ports/index";
import type { FeatureFlags, RuntimeEnv } from "../types/index";

import { createAuthService, type AuthService } from "./auth";
import { createRequestClient, type RequestClient } from "./request";
import { createRouterService, type RouteMapper, type RouterService } from "./router";
import { createSessionService, type SessionService } from "./session";

export interface PlatformAdapters {
  request: RequestAdapter;
  storage: StorageAdapter;
  auth: AuthAdapter;
  router: RouterAdapter;
  ui: UIAdapter;
}

export interface CreateAppKernelOptions {
  env: RuntimeEnv;
  features: FeatureFlags;
  adapters: PlatformAdapters;
  routeMapper?: RouteMapper;
}

export interface AppKernel {
  env: RuntimeEnv;
  features: FeatureFlags;
  storage: CacheService;
  session: SessionService;
  request: RequestClient;
  auth: AuthService;
  router: RouterService;
  ui: UIAdapter;
}

export function loadFeatureFlags(): FeatureFlags {
  return {
    enableAutoLogin: true,
    enableRouteGuard: false,
  };
}

export function createAppKernel(options: CreateAppKernelOptions): AppKernel {
  const storage = createCacheService(options.adapters.storage);
  const session = createSessionService(storage);
  let auth!: AuthService;
  const request = createRequestClient({
    adapter: options.adapters.request,
    getSession: () => session.get(),
    refreshSession: async (currentSession) => auth.refreshSession!(currentSession),
    apiBaseUrl: options.env.apiBaseUrl,
  });
  auth = createAuthService({
    adapter: options.adapters.auth,
    request,
    session,
    env: options.env,
  });
  const router = createRouterService({
    adapter: options.adapters.router,
    ...(options.routeMapper ? { routeMapper: options.routeMapper } : {}),
  });

  return {
    env: options.env,
    features: options.features,
    storage,
    session,
    request,
    auth,
    router,
    ui: options.adapters.ui,
  };
}

export async function bootstrapApp(options: CreateAppKernelOptions): Promise<AppKernel> {
  const kernel = createAppKernel(options);

  if (kernel.features.enableAutoLogin) {
    await kernel.auth.ensureLogin();
  }

  return kernel;
}
