// GENERATED FILE. DO NOT EDIT.

import {
  bootstrapApp,
  createAppKernel,
  createHostPageDataMap,
  createHostPageManifest,
  createHostRouteKeyMap,
  createHostRouteMap,
  createHostWechatMiniprogramPages,
  createRouteMapper,
  type AppKernel,
  type CreateAppKernelOptions,
} from "@minix/core";

import type {
  HostWechatPageRegistry,
  HostWechatPages,
} from "../registrations/page-registry";

import {
  hostWechatFeatureFlags,
  hostWechatPageDefinitions,
} from "./page-definitions";

export const hostWechatManifestPages = createHostPageDataMap(hostWechatPageDefinitions);
export const hostWechatPageManifest = createHostPageManifest(hostWechatPageDefinitions);
export const hostWechatRoutes = createHostRouteMap(hostWechatPageDefinitions);
export const HOST_WECHAT_ROUTES = createHostRouteKeyMap(hostWechatPageDefinitions);
export const HOST_WECHAT_MINIPROGRAM_PAGES = createHostWechatMiniprogramPages(hostWechatPageDefinitions);

function loadHostWechatPageRegistryModule() {
  return require("../registrations/page-registry") as typeof import("../registrations/page-registry");
}

function createHostWechatKernelOptions(): CreateAppKernelOptions {
  const { createWechatAdapters } = require("@minix/platform-wechat") as typeof import("@minix/platform-wechat");
  const { loadHostWechatEnv } = require("../bootstrap/env") as typeof import("../bootstrap/env");
  const { createHostWechatMockApiAdapter } = require("../bootstrap/mock-api") as typeof import("../bootstrap/mock-api");
  const env = loadHostWechatEnv();
  const baseAdapters = createWechatAdapters();

  return {
    env,
    features: hostWechatFeatureFlags,
    routeMapper: createRouteMapper(hostWechatRoutes),
    adapters: env.debug
      ? {
          ...baseAdapters,
          request: createHostWechatMockApiAdapter(),
        }
      : baseAdapters,
  };
}

export function createHostWechatKernel() {
  return createAppKernel(createHostWechatKernelOptions());
}

export async function bootstrapHostWechatApp() {
  return bootstrapApp(createHostWechatKernelOptions());
}

export interface HostWechatRuntime {
  kernel: AppKernel;
  registry: HostWechatPageRegistry;
  pages: HostWechatPages;
}

function toHostWechatPages(registry: HostWechatPageRegistry): HostWechatPages {
  return Object.fromEntries(
    Object.entries(registry).map(([key, entry]) => [key, entry.controller]),
  ) as HostWechatPages;
}

export function createHostWechatRuntime(kernel: AppKernel = createHostWechatKernel()): HostWechatRuntime {
  const { createHostWechatPageRegistry } = loadHostWechatPageRegistryModule();
  const registry = createHostWechatPageRegistry(kernel);

  return {
    kernel,
    registry,
    pages: toHostWechatPages(registry),
  };
}

export async function bootstrapHostWechatRuntime(): Promise<HostWechatRuntime> {
  const kernel = await bootstrapHostWechatApp();
  return createHostWechatRuntime(kernel);
}

export const hostWechatManifest = {
  pageDefinitions: hostWechatPageDefinitions,
  pageManifest: hostWechatPageManifest,
  routes: hostWechatRoutes,
  pages: hostWechatManifestPages,
  features: hostWechatFeatureFlags,
  createKernelOptions: createHostWechatKernelOptions,
  createKernel: createHostWechatKernel,
  createPageRegistry(kernel: AppKernel) {
    const { createHostWechatPageRegistry } = loadHostWechatPageRegistryModule();
    return createHostWechatPageRegistry(kernel);
  },
  createRuntime: createHostWechatRuntime,
  bootstrapRuntime: bootstrapHostWechatRuntime,
} as const;
