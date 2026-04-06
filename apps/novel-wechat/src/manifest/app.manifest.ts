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
  NovelWechatPageRegistry,
  NovelWechatPages,
} from "../registrations/page-registry";

import {
  novelWechatFeatureFlags,
  novelWechatPageDefinitions,
} from "./page-definitions";

export const novelWechatManifestPages = createHostPageDataMap(novelWechatPageDefinitions);
export const novelWechatPageManifest = createHostPageManifest(novelWechatPageDefinitions);
export const novelWechatRoutes = createHostRouteMap(novelWechatPageDefinitions);
export const NOVEL_WECHAT_ROUTES = createHostRouteKeyMap(novelWechatPageDefinitions);
export const NOVEL_WECHAT_MINIPROGRAM_PAGES = createHostWechatMiniprogramPages(novelWechatPageDefinitions);

function loadNovelWechatPageRegistryModule() {
  return require("../registrations/page-registry") as typeof import("../registrations/page-registry");
}

function createNovelWechatKernelOptions(): CreateAppKernelOptions {
  const { createWechatAdapters } = require("@minix/platform-wechat") as typeof import("@minix/platform-wechat");
  const { loadNovelWechatEnv } = require("../bootstrap/env") as typeof import("../bootstrap/env");
  const { createNovelWechatMockApiAdapter } = require("../bootstrap/mock-api") as typeof import("../bootstrap/mock-api");
  const env = loadNovelWechatEnv();
  const baseAdapters = createWechatAdapters();

  return {
    env,
    features: novelWechatFeatureFlags,
    routeMapper: createRouteMapper(novelWechatRoutes),
    adapters: env.debug
      ? {
          ...baseAdapters,
          request: createNovelWechatMockApiAdapter(),
        }
      : baseAdapters,
  };
}

export function createNovelWechatKernel() {
  return createAppKernel(createNovelWechatKernelOptions());
}

export async function bootstrapNovelWechatApp() {
  return bootstrapApp(createNovelWechatKernelOptions());
}

export interface NovelWechatRuntime {
  kernel: AppKernel;
  registry: NovelWechatPageRegistry;
  pages: NovelWechatPages;
}

function toNovelWechatPages(registry: NovelWechatPageRegistry): NovelWechatPages {
  return Object.fromEntries(
    Object.entries(registry).map(([key, entry]) => [key, entry.controller]),
  ) as NovelWechatPages;
}

export function createNovelWechatRuntime(kernel: AppKernel = createNovelWechatKernel()): NovelWechatRuntime {
  const { createNovelWechatPageRegistry } = loadNovelWechatPageRegistryModule();
  const registry = createNovelWechatPageRegistry(kernel);

  return {
    kernel,
    registry,
    pages: toNovelWechatPages(registry),
  };
}

export async function bootstrapNovelWechatRuntime(): Promise<NovelWechatRuntime> {
  const kernel = await bootstrapNovelWechatApp();
  return createNovelWechatRuntime(kernel);
}

export const novelWechatManifest = {
  pageDefinitions: novelWechatPageDefinitions,
  pageManifest: novelWechatPageManifest,
  routes: novelWechatRoutes,
  pages: novelWechatManifestPages,
  features: novelWechatFeatureFlags,
  createKernelOptions: createNovelWechatKernelOptions,
  createKernel: createNovelWechatKernel,
  createPageRegistry(kernel: AppKernel) {
    const { createNovelWechatPageRegistry } = loadNovelWechatPageRegistryModule();
    return createNovelWechatPageRegistry(kernel);
  },
  createRuntime: createNovelWechatRuntime,
  bootstrapRuntime: bootstrapNovelWechatRuntime,
} as const;
