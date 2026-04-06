// GENERATED FILE. DO NOT EDIT.

import { createManifestPageRegistry, type AppKernel } from "@minix/core";

import { hostWechatManifest } from "../manifest/app.manifest";

export const hostWechatPageRegistryFactories = Object.fromEntries(
  Object.keys(hostWechatManifest.pageDefinitions).map((pageKey) => [pageKey, pageKey]),
) as Record<keyof typeof hostWechatManifest.pageDefinitions, string>;

export function createHostWechatPageRegistry(kernel: AppKernel) {
  return createManifestPageRegistry("wechat", kernel, hostWechatManifest.pageDefinitions);
}

export type HostWechatPageRegistry = ReturnType<typeof createHostWechatPageRegistry>;

export type HostWechatPages = {
  [TKey in keyof HostWechatPageRegistry]: HostWechatPageRegistry[TKey]["controller"];
};
