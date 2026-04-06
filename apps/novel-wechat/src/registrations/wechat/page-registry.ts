// GENERATED FILE. DO NOT EDIT.

import { createWechatPageBridge } from "@minix/platform-wechat";

import type { HostPageDefinition } from "@minix/core";

import type { NovelWechatRuntime } from "../../manifest/app.manifest";
import { createNovelWechatPageEntry } from "../page-entries";
import { novelWechatManifest } from "../../manifest/app.manifest";

import { ensureNovelWechatRuntime } from "./runtime";

type HostWechatPageDefinition = HostPageDefinition;
export type NovelWechatShellPageKey = keyof NovelWechatRuntime["registry"];

const lifecycleActions = new Set(["onShow", "onPullDownRefresh", "onReachBottom"]);

async function loadHostWechatPageEntry<TKey extends NovelWechatShellPageKey>(
  pageKey: TKey,
): Promise<ReturnType<NovelWechatRuntime["registry"][TKey]["createEntry"]>> {
  const runtime = await ensureNovelWechatRuntime();
  return createNovelWechatPageEntry(runtime, pageKey);
}

function createHostWechatShellPage(pageKey: NovelWechatShellPageKey, definition: HostWechatPageDefinition) {
  const entryActions = definition.feature.hosts.wechat.entryActions;
  const methods: Record<
    string,
    (
      entry: Record<string, (...args: unknown[]) => Promise<unknown>>,
      page: unknown,
      ...args: unknown[]
    ) => Promise<unknown>
  > = {};
  const bridgeConfig: Record<string, unknown> = {
    initialData: definition.pageData,
    async loadEntry() {
      return loadHostWechatPageEntry(pageKey);
    },
    methods,
  };

  for (const [entryAction, controllerAction] of Object.entries(entryActions)) {
    if (lifecycleActions.has(entryAction)) {
      bridgeConfig[entryAction] = async (entry: Record<string, (...args: unknown[]) => Promise<unknown>>) => {
        const handler = entry[entryAction];
        if (typeof handler !== "function") {
          throw new Error(`entry action "${entryAction}" is not available for "${pageKey}"`);
        }

        return handler.call(entry);
      };
      continue;
    }

    methods[entryAction] = async (
      entry: Record<string, (...args: unknown[]) => Promise<unknown>>,
      _page: unknown,
      ...args: unknown[]
    ) => {
      const handler = entry[entryAction];
      if (typeof handler !== "function") {
        throw new Error(`entry action "${entryAction}" is not available for "${pageKey}"`);
      }

      const eventArg = args[0] as { currentTarget?: { dataset?: { value?: unknown } } } | undefined;
      const datasetValue = eventArg?.currentTarget?.dataset?.value;

      if (typeof datasetValue === "string" || typeof datasetValue === "number") {
        return handler.call(entry, datasetValue);
      }

      return handler.call(entry);
    };
  }

  return createWechatPageBridge(
    bridgeConfig as unknown as Parameters<typeof createWechatPageBridge>[0],
  );
}

export const novelWechatShellPageRegistry = Object.fromEntries(
  Object.entries(novelWechatManifest.pageDefinitions).map(([pageKey, definition]) => [
    pageKey,
    () => createHostWechatShellPage(pageKey as NovelWechatShellPageKey, definition),
  ]),
) as Record<NovelWechatShellPageKey, () => ReturnType<typeof createWechatPageBridge>>;

export function registerNovelWechatPage<TKey extends keyof typeof novelWechatShellPageRegistry>(
  pageKey: TKey,
): ReturnType<(typeof novelWechatShellPageRegistry)[TKey]> {
  return novelWechatShellPageRegistry[pageKey]() as ReturnType<(typeof novelWechatShellPageRegistry)[TKey]>;
}
