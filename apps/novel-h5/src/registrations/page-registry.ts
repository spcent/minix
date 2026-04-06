// GENERATED FILE. DO NOT EDIT.

import { createManifestPageRegistry, type AppKernel } from "@minix/core";

import { novelH5Manifest } from "../manifest/app.manifest";

export const novelH5PageRegistryFactories = Object.fromEntries(
  Object.keys(novelH5Manifest.pageDefinitions).map((pageKey) => [pageKey, pageKey]),
) as Record<keyof typeof novelH5Manifest.pageDefinitions, string>;

export function createNovelH5PageRegistry(kernel: AppKernel) {
  return createManifestPageRegistry("h5", kernel, novelH5Manifest.pageDefinitions);
}

export type NovelH5PageRegistry = ReturnType<typeof createNovelH5PageRegistry>;

export type NovelH5Pages = {
  [TKey in keyof NovelH5PageRegistry]: NovelH5PageRegistry[TKey]["controller"];
};
