// GENERATED FILE. DO NOT EDIT.

import { createManifestPageRegistry, type AppKernel } from "@minix/core";

import { hostH5Manifest } from "../manifest/app.manifest";

export const hostH5PageRegistryFactories = Object.fromEntries(
  Object.keys(hostH5Manifest.pageDefinitions).map((pageKey) => [pageKey, pageKey]),
) as Record<keyof typeof hostH5Manifest.pageDefinitions, string>;

export function createHostH5PageRegistry(kernel: AppKernel) {
  return createManifestPageRegistry("h5", kernel, hostH5Manifest.pageDefinitions);
}

export type HostH5PageRegistry = ReturnType<typeof createHostH5PageRegistry>;

export type HostH5Pages = {
  [TKey in keyof HostH5PageRegistry]: HostH5PageRegistry[TKey]["controller"];
};
