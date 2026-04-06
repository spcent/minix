// GENERATED FILE. DO NOT EDIT.

import { createWechatPageBridge } from "@minix/platform-wechat";

import type { HostPageDefinition } from "@minix/core";

import type { HostWechatRuntime } from "../../manifest/app.manifest";
import { createHostWechatPageEntry } from "../page-entries";
import { hostWechatManifest } from "../../manifest/app.manifest";

import { ensureHostWechatRuntime } from "./runtime";

type HostWechatPageDefinition = HostPageDefinition;
export type HostWechatShellPageKey = keyof HostWechatRuntime["registry"];

const lifecycleActions = new Set(["onShow", "onPullDownRefresh", "onReachBottom"]);

async function loadHostWechatPageEntry<TKey extends HostWechatShellPageKey>(
  pageKey: TKey,
): Promise<ReturnType<HostWechatRuntime["registry"][TKey]["createEntry"]>> {
  const runtime = await ensureHostWechatRuntime();
  return createHostWechatPageEntry(runtime, pageKey);
}

function createHostWechatShellPage(pageKey: HostWechatShellPageKey, definition: HostWechatPageDefinition) {
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

export const hostWechatShellPageRegistry = Object.fromEntries(
  Object.entries(hostWechatManifest.pageDefinitions).map(([pageKey, definition]) => [
    pageKey,
    () => createHostWechatShellPage(pageKey as HostWechatShellPageKey, definition),
  ]),
) as Record<HostWechatShellPageKey, () => ReturnType<typeof createWechatPageBridge>>;

export function registerHostWechatPage<TKey extends keyof typeof hostWechatShellPageRegistry>(
  pageKey: TKey,
): ReturnType<(typeof hostWechatShellPageRegistry)[TKey]> {
  return hostWechatShellPageRegistry[pageKey]() as ReturnType<(typeof hostWechatShellPageRegistry)[TKey]>;
}
