// GENERATED FILE. DO NOT EDIT.

import { createManifestPageRegistry, type AppKernel } from "@minix/core";

import { novelWechatManifest } from "../manifest/app.manifest";

export const novelWechatPageRegistryFactories = Object.fromEntries(
  Object.keys(novelWechatManifest.pageDefinitions).map((pageKey) => [pageKey, pageKey]),
) as Record<keyof typeof novelWechatManifest.pageDefinitions, string>;

export function createNovelWechatPageRegistry(kernel: AppKernel) {
  return createManifestPageRegistry("wechat", kernel, novelWechatManifest.pageDefinitions);
}

export type NovelWechatPageRegistry = ReturnType<typeof createNovelWechatPageRegistry>;

export type NovelWechatPages = {
  [TKey in keyof NovelWechatPageRegistry]: NovelWechatPageRegistry[TKey]["controller"];
};
