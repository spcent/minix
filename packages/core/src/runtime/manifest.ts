import type { AppRouteId, AppRouteMap } from "@minix/contracts";

import type { AppKernel } from "./app";
import type { FeatureFlags } from "../types/index";

export type HostKind = "wechat" | "h5";

type MethodKey<TController> = Extract<
  0 extends 1 & TController
    ? string
    : [unknown] extends [TController]
      ? string
      : {
          [TKey in keyof TController]: TController[TKey] extends (...args: infer TArgs) => unknown
            ? TKey
            : never;
        }[keyof TController],
  string
>;

type HostEntryActions<TController> = Record<string, MethodKey<TController>>;

export interface HostFeatureBehavior<
  TController = any,
  TEntryActions extends HostEntryActions<TController> = HostEntryActions<TController>,
> {
  entryActions: TEntryActions;
}

type HostBehaviorMap<TController = any> = Record<HostKind, HostFeatureBehavior<TController>>;

export interface FeatureManifest<
  TControllerOptions = unknown,
  TPageData = unknown,
  TController = any,
  THosts extends HostBehaviorMap<TController> = HostBehaviorMap<TController>,
> {
  featureKey: string;
  pageKey: string;
  packageName: string;
  exportName: string;
  createController(
    host: HostKind,
    kernel: AppKernel,
    options: TControllerOptions,
    pageData: TPageData,
  ): TController;
  hosts: THosts;
}

export function defineFeatureManifest<
  TControllerOptions,
  TPageData,
  TController,
>() {
  return function <THosts extends HostBehaviorMap<TController>, TManifest extends FeatureManifest<
    TControllerOptions,
    TPageData,
    TController,
    THosts
  >>(manifest: TManifest): TManifest {
    return manifest;
  };
}

export interface HostPageDefinition<
  TControllerOptions = unknown,
  TPageData = unknown,
  TController = any,
  THosts extends HostBehaviorMap = HostBehaviorMap,
> {
  feature: FeatureManifest<TControllerOptions, TPageData, TController, THosts>;
  routeId: AppRouteId;
  routePath: string;
  controller: TControllerOptions;
  pageData: TPageData;
  renderMode?: "custom" | "generic";
  miniprogramPage?: string;
  registrationModule?: string;
  navigationBarTitleText?: string;
  enablePullDownRefresh?: boolean;
  shellTemplate?: string;
  shellStyle?: string;
}

export type HostPageDefinitions = Record<string, HostPageDefinition>;

export function defineHostFeatureFlags<TFeatureFlags extends FeatureFlags>(featureFlags: TFeatureFlags): TFeatureFlags {
  return featureFlags;
}

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function assertHostPageDefinition(pageKey: string, definition: HostPageDefinition) {
  assertNonEmptyString(definition.routeId, `page "${pageKey}" routeId`);
  assertNonEmptyString(definition.routePath, `page "${pageKey}" routePath`);

  if (!definition.routePath.startsWith("/")) {
    throw new Error(`page "${pageKey}" routePath must start with "/"`);
  }

  if (definition.miniprogramPage) {
    assertNonEmptyString(definition.miniprogramPage, `page "${pageKey}" miniprogramPage`);

    if (!definition.registrationModule) {
      throw new Error(`page "${pageKey}" registrationModule is required when miniprogramPage is set`);
    }
  }

  if (definition.registrationModule) {
    assertNonEmptyString(definition.registrationModule, `page "${pageKey}" registrationModule`);

    if (!definition.miniprogramPage) {
      throw new Error(`page "${pageKey}" miniprogramPage is required when registrationModule is set`);
    }
  }

  const hasShellTemplate = typeof definition.shellTemplate === "string";
  const hasShellStyle = typeof definition.shellStyle === "string";
  if (hasShellTemplate !== hasShellStyle) {
    throw new Error(`page "${pageKey}" shellTemplate and shellStyle must be configured together`);
  }
}

export function defineHostPageDefinitions<TDefinitions extends HostPageDefinitions>(definitions: TDefinitions): TDefinitions {
  for (const [pageKey, definition] of Object.entries(definitions)) {
    assertHostPageDefinition(pageKey, definition);
  }

  return definitions;
}

type EntryActionsForBehavior<TBehavior extends HostFeatureBehavior> = {
  [TKey in keyof TBehavior["entryActions"]]: (...args: unknown[]) => Promise<unknown>;
};

type ManifestPageRegistryEntry<TController, TBehavior extends HostFeatureBehavior> = {
  controller: TController;
  createEntry(): {
    controller: TController;
  } & EntryActionsForBehavior<TBehavior>;
};

function createEntry<TController, TBehavior extends HostFeatureBehavior>(
  controller: TController,
  actionMap: TBehavior["entryActions"],
): {
  controller: TController;
} & EntryActionsForBehavior<TBehavior> {
  const entry: Record<string, unknown> = {
    controller,
  };

  for (const [entryAction, controllerAction] of Object.entries(actionMap)) {
    entry[entryAction] = async (...args: unknown[]) => {
      const target = (controller as Record<string, unknown>)[controllerAction];
      if (typeof target !== "function") {
        throw new Error(`controller action "${controllerAction}" is not implemented`);
      }

      return target.call(controller, ...args);
    };
  }

  return entry as {
    controller: TController;
  } & EntryActionsForBehavior<TBehavior>;
}

export function createHostPageDataMap<TDefinitions extends HostPageDefinitions>(
  definitions: TDefinitions,
): {
  [TKey in keyof TDefinitions]: TDefinitions[TKey]["pageData"];
} {
  return Object.fromEntries(
    Object.entries(definitions).map(([pageKey, definition]) => [pageKey, definition.pageData]),
  ) as {
    [TKey in keyof TDefinitions]: TDefinitions[TKey]["pageData"];
  };
}

export function createHostRouteMap<TDefinitions extends HostPageDefinitions>(definitions: TDefinitions): AppRouteMap {
  return Object.fromEntries(
    Object.values(definitions).map((definition) => [definition.routeId, definition.routePath]),
  ) as AppRouteMap;
}

export function createHostRouteKeyMap<TDefinitions extends HostPageDefinitions>(
  definitions: TDefinitions,
): {
  [TKey in keyof TDefinitions]: TDefinitions[TKey]["routePath"];
} {
  return Object.fromEntries(
    Object.entries(definitions).map(([pageKey, definition]) => [pageKey, definition.routePath]),
  ) as {
    [TKey in keyof TDefinitions]: TDefinitions[TKey]["routePath"];
  };
}

export function createHostPageManifest<TDefinitions extends HostPageDefinitions>(
  definitions: TDefinitions,
): {
  [TKey in keyof TDefinitions]: Omit<TDefinitions[TKey], "feature" | "controller" | "pageData">;
} {
  return Object.fromEntries(
    Object.entries(definitions).map(([pageKey, definition]) => {
      const { feature: _feature, controller: _controller, pageData: _pageData, ...manifest } = definition;
      return [pageKey, manifest];
    }),
  ) as {
    [TKey in keyof TDefinitions]: Omit<TDefinitions[TKey], "feature" | "controller" | "pageData">;
  };
}

export function createHostWechatMiniprogramPages<TDefinitions extends HostPageDefinitions>(definitions: TDefinitions): string[] {
  return Object.values(definitions)
    .map((definition) => definition.miniprogramPage)
    .filter((page): page is string => typeof page === "string");
}

export function createManifestPageRegistry<TDefinitions extends HostPageDefinitions, THost extends HostKind>(
  host: THost,
  kernel: AppKernel,
  definitions: TDefinitions,
): {
  [TKey in keyof TDefinitions]: TDefinitions[TKey] extends HostPageDefinition<
    infer _TControllerOptions,
    infer _TPageData,
    infer TController,
    infer THosts
  >
    ? ManifestPageRegistryEntry<TController, THosts[THost]>
    : never;
} {
  return Object.fromEntries(
    Object.entries(definitions).map(([pageKey, definition]) => {
      const controller = definition.feature.createController(host, kernel, definition.controller, definition.pageData);
      return [
        pageKey,
        {
          controller,
          createEntry() {
            return createEntry(controller, definition.feature.hosts[host].entryActions);
          },
        },
      ];
    }),
  ) as {
    [TKey in keyof TDefinitions]: TDefinitions[TKey] extends HostPageDefinition<
      infer _TControllerOptions,
      infer _TPageData,
      infer TController,
      infer THosts
    >
      ? ManifestPageRegistryEntry<TController, THosts[THost]>
      : never;
  };
}
