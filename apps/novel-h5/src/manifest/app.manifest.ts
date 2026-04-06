// GENERATED FILE. DO NOT EDIT.

import {
  bootstrapApp,
  createAppKernel,
  createHostPageDataMap,
  createHostPageManifest,
  createHostRouteKeyMap,
  createHostRouteMap,
  createRouteMapper,
  type AppKernel,
  type CreateAppKernelOptions,
} from "@minix/core";

import type {
  NovelH5PageRegistry,
  NovelH5Pages,
} from "../registrations/page-registry";

import {
  novelH5FeatureFlags,
  novelH5PageDefinitions,
} from "./page-definitions";

export const novelH5ManifestPages = createHostPageDataMap(novelH5PageDefinitions);
export const novelH5PageManifest = createHostPageManifest(novelH5PageDefinitions);
export const novelH5Routes = createHostRouteMap(novelH5PageDefinitions);
export const NOVEL_H5_ROUTES = createHostRouteKeyMap(novelH5PageDefinitions);

function loadNovelH5PageRegistryModule() {
  return require("../registrations/page-registry") as typeof import("../registrations/page-registry");
}

function createNovelH5KernelOptions(): CreateAppKernelOptions {
  const { createH5Adapters } = require("@minix/platform-h5") as typeof import("@minix/platform-h5");
  const { loadNovelH5Env } = require("../bootstrap/env") as typeof import("../bootstrap/env");
  const { createNovelH5MockApiAdapter } = require("../bootstrap/mock-api") as typeof import("../bootstrap/mock-api");
  const env = loadNovelH5Env();
  const baseAdapters = createH5Adapters();

  return {
    env,
    features: novelH5FeatureFlags,
    routeMapper: createRouteMapper(novelH5Routes),
    adapters: env.debug
      ? {
          ...baseAdapters,
          request: createNovelH5MockApiAdapter(),
        }
      : baseAdapters,
  };
}

export function createNovelH5Kernel() {
  return createAppKernel(createNovelH5KernelOptions());
}

export async function bootstrapNovelH5App() {
  return bootstrapApp(createNovelH5KernelOptions());
}

export interface NovelH5Runtime {
  kernel: AppKernel;
  registry: NovelH5PageRegistry;
  pages: NovelH5Pages;
}

function toNovelH5Pages(registry: NovelH5PageRegistry): NovelH5Pages {
  return Object.fromEntries(
    Object.entries(registry).map(([key, entry]) => [key, entry.controller]),
  ) as NovelH5Pages;
}

export function createNovelH5Runtime(kernel: AppKernel = createNovelH5Kernel()): NovelH5Runtime {
  const { createNovelH5PageRegistry } = loadNovelH5PageRegistryModule();
  const registry = createNovelH5PageRegistry(kernel);

  return {
    kernel,
    registry,
    pages: toNovelH5Pages(registry),
  };
}

export async function bootstrapNovelH5Runtime(): Promise<NovelH5Runtime> {
  const kernel = await bootstrapNovelH5App();
  return createNovelH5Runtime(kernel);
}

export const novelH5Manifest = {
  pageDefinitions: novelH5PageDefinitions,
  pageManifest: novelH5PageManifest,
  routes: novelH5Routes,
  pages: novelH5ManifestPages,
  features: novelH5FeatureFlags,
  createKernelOptions: createNovelH5KernelOptions,
  createKernel: createNovelH5Kernel,
  createPageRegistry(kernel: AppKernel) {
    const { createNovelH5PageRegistry } = loadNovelH5PageRegistryModule();
    return createNovelH5PageRegistry(kernel);
  },
  createRuntime: createNovelH5Runtime,
  bootstrapRuntime: bootstrapNovelH5Runtime,
} as const;
