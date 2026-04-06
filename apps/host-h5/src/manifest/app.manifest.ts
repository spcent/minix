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
  HostH5PageRegistry,
  HostH5Pages,
} from "../registrations/page-registry";

import {
  hostH5FeatureFlags,
  hostH5PageDefinitions,
} from "./page-definitions";

export const hostH5ManifestPages = createHostPageDataMap(hostH5PageDefinitions);
export const hostH5PageManifest = createHostPageManifest(hostH5PageDefinitions);
export const hostH5Routes = createHostRouteMap(hostH5PageDefinitions);
export const HOST_H5_ROUTES = createHostRouteKeyMap(hostH5PageDefinitions);

function loadHostH5PageRegistryModule() {
  return require("../registrations/page-registry") as typeof import("../registrations/page-registry");
}

function createHostH5KernelOptions(): CreateAppKernelOptions {
  const { createH5Adapters } = require("@minix/platform-h5") as typeof import("@minix/platform-h5");
  const { loadHostH5Env } = require("../bootstrap/env") as typeof import("../bootstrap/env");
  const { createHostH5MockApiAdapter } = require("../bootstrap/mock-api") as typeof import("../bootstrap/mock-api");
  const env = loadHostH5Env();
  const baseAdapters = createH5Adapters();

  return {
    env,
    features: hostH5FeatureFlags,
    routeMapper: createRouteMapper(hostH5Routes),
    adapters: env.debug
      ? {
          ...baseAdapters,
          request: createHostH5MockApiAdapter(),
        }
      : baseAdapters,
  };
}

export function createHostH5Kernel() {
  return createAppKernel(createHostH5KernelOptions());
}

export async function bootstrapHostH5App() {
  return bootstrapApp(createHostH5KernelOptions());
}

export interface HostH5Runtime {
  kernel: AppKernel;
  registry: HostH5PageRegistry;
  pages: HostH5Pages;
}

function toHostH5Pages(registry: HostH5PageRegistry): HostH5Pages {
  return Object.fromEntries(
    Object.entries(registry).map(([key, entry]) => [key, entry.controller]),
  ) as HostH5Pages;
}

export function createHostH5Runtime(kernel: AppKernel = createHostH5Kernel()): HostH5Runtime {
  const { createHostH5PageRegistry } = loadHostH5PageRegistryModule();
  const registry = createHostH5PageRegistry(kernel);

  return {
    kernel,
    registry,
    pages: toHostH5Pages(registry),
  };
}

export async function bootstrapHostH5Runtime(): Promise<HostH5Runtime> {
  const kernel = await bootstrapHostH5App();
  return createHostH5Runtime(kernel);
}

export const hostH5Manifest = {
  pageDefinitions: hostH5PageDefinitions,
  pageManifest: hostH5PageManifest,
  routes: hostH5Routes,
  pages: hostH5ManifestPages,
  features: hostH5FeatureFlags,
  createKernelOptions: createHostH5KernelOptions,
  createKernel: createHostH5Kernel,
  createPageRegistry(kernel: AppKernel) {
    const { createHostH5PageRegistry } = loadHostH5PageRegistryModule();
    return createHostH5PageRegistry(kernel);
  },
  createRuntime: createHostH5Runtime,
  bootstrapRuntime: bootstrapHostH5Runtime,
} as const;
