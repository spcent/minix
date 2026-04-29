import {
  APP_ROUTE_IDS,
  CAPABILITY_KINDS,
  type AppRouteId,
  type AppRouteMap,
  type AuthRedirectReason,
  type CapabilityRequirement,
  type GuardPolicy,
} from "@minix/contracts";

import type { AppKernel } from "./app";
import { createAuthRedirectParams } from "./auth-redirect";
import type { FeatureConfig, FeatureFlags, UserSession } from "../types/index";

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

type EmptyHostEntryActions = Record<string, never>;

export function defineSharedHostBehavior<TController>() {
  return function <
    TCommon extends HostEntryActions<TController>,
    TWechat extends HostEntryActions<TController> = EmptyHostEntryActions,
    TH5 extends HostEntryActions<TController> = EmptyHostEntryActions,
  >(
    commonEntryActions: TCommon,
    hostEntryActions: {
      wechat?: TWechat;
      h5?: TH5;
    } = {},
  ): {
    wechat: HostFeatureBehavior<TController, TCommon & TWechat>;
    h5: HostFeatureBehavior<TController, TCommon & TH5>;
  } {
    return {
      wechat: {
        entryActions: {
          ...commonEntryActions,
          ...(hostEntryActions.wechat ?? {}),
        } as TCommon & TWechat,
      },
      h5: {
        entryActions: {
          ...commonEntryActions,
          ...(hostEntryActions.h5 ?? {}),
        } as TCommon & TH5,
      },
    };
  };
}

export function pickDefinedManifestOptions<TOptions extends object, TKey extends keyof TOptions>(
  options: TOptions,
  keys: readonly TKey[],
): Partial<Pick<TOptions, TKey>> {
  const result: Partial<Pick<TOptions, TKey>> = {};

  for (const key of keys) {
    const value = options[key];
    if (value !== undefined) {
      (result as Record<PropertyKey, unknown>)[key as PropertyKey] = value;
    }
  }

  return result;
}

export function mergeFeaturePageState<TState extends object>(
  ...states: Array<Partial<TState> | undefined>
): TState {
  return Object.assign({}, ...states) as TState;
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
  requiredCapabilities?: CapabilityRequirement[];
  guardPolicy?: GuardPolicy;
  featureConfig?: FeatureConfig;
  renderMode?: "custom" | "generic";
  miniprogramPage?: string;
  registrationModule?: string;
  navigationBarTitleText?: string;
  enablePullDownRefresh?: boolean;
  shellTemplate?: string;
  shellStyle?: string;
}

export type HostPageDefinitions = Record<string, HostPageDefinition>;

export type WechatShellConfig = Pick<
  HostPageDefinition,
  "miniprogramPage" | "registrationModule" | "navigationBarTitleText" | "enablePullDownRefresh" | "shellTemplate" | "shellStyle"
>;

export interface CreateWechatShellConfigOptions {
  page: string;
  registrationPage?: string;
  navigationBarTitleText?: string;
  enablePullDownRefresh?: boolean;
  shellTemplate: string;
  shellStyle: string;
}

export function createAuthenticatedGuardPolicy(name: string, onFail?: GuardPolicy["onFail"]): GuardPolicy {
  return {
    name,
    requirements: {
      authenticated: true,
    },
    ...(onFail ? { onFail } : {}),
  };
}

export function createWechatShellConfig(options: CreateWechatShellConfigOptions): WechatShellConfig {
  const registrationPage = options.registrationPage ?? options.page;

  return {
    miniprogramPage: `pages/${options.page}/index`,
    registrationModule: `../../../src/registrations/wechat/pages/${registrationPage}`,
    ...(options.navigationBarTitleText ? { navigationBarTitleText: options.navigationBarTitleText } : {}),
    ...(options.enablePullDownRefresh !== undefined ? { enablePullDownRefresh: options.enablePullDownRefresh } : {}),
    shellTemplate: options.shellTemplate,
    shellStyle: options.shellStyle,
  };
}

export function defineHostFeatureFlags<TFeatureFlags extends FeatureFlags>(featureFlags: TFeatureFlags): TFeatureFlags {
  return featureFlags;
}

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function assertHostPageDefinition(pageKey: string, definition: HostPageDefinition) {
  const validCapabilities = new Set<string>(CAPABILITY_KINDS);

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

  if (definition.requiredCapabilities !== undefined) {
    if (!Array.isArray(definition.requiredCapabilities)) {
      throw new Error(`page "${pageKey}" requiredCapabilities must be an array when provided`);
    }

    for (const requirement of definition.requiredCapabilities) {
      if (!requirement || typeof requirement !== "object") {
        throw new Error(`page "${pageKey}" requiredCapabilities entries must be objects`);
      }

      if (typeof requirement.capability !== "string" || !validCapabilities.has(requirement.capability)) {
        throw new Error(`page "${pageKey}" requiredCapabilities contains unknown capability "${String(requirement.capability)}"`);
      }
    }
  }

  if (definition.guardPolicy !== undefined && (typeof definition.guardPolicy !== "object" || definition.guardPolicy === null)) {
    throw new Error(`page "${pageKey}" guardPolicy must be an object when provided`);
  }

  if (definition.featureConfig !== undefined && (typeof definition.featureConfig !== "object" || definition.featureConfig === null || Array.isArray(definition.featureConfig))) {
    throw new Error(`page "${pageKey}" featureConfig must be an object when provided`);
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

function isRouteParamValue(value: unknown): value is string | number | boolean {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function toRouteParams(value: unknown): Record<string, string | number | boolean> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const entries = Object.entries(value).filter(([, entry]) => isRouteParamValue(entry));
  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

function shouldEnforceAuthGuard(kernel: AppKernel, guardPolicy?: GuardPolicy): boolean {
  return Boolean(kernel.features.enableRouteGuard && guardPolicy?.requirements?.authenticated);
}

function isExpiredSession(session: UserSession | null | undefined): boolean {
  return Boolean(session?.loggedIn && session.token?.accessToken && session.token.expiresAt !== undefined && session.token.expiresAt <= Date.now());
}

function normalizeRedirectReason(reason: string | undefined, fallback: AuthRedirectReason): AuthRedirectReason {
  return reason === "auth-required" || reason === "session-expired" || reason === "force-relogin" ? reason : fallback;
}

function createGuardRedirectParams(input: {
  pageKey: string;
  definition: HostPageDefinition;
  routeParams?: Record<string, string | number | boolean> | undefined;
  reason: AuthRedirectReason;
}) {
  return createAuthRedirectParams({
    routeId: input.definition.routeId,
    path: input.definition.routePath,
    ...(input.routeParams ? { params: input.routeParams } : {}),
    source: input.pageKey,
    ...(input.definition.navigationBarTitleText ? { label: input.definition.navigationBarTitleText } : {}),
    reason: input.reason,
    forceReauth: input.reason === "force-relogin",
  });
}

async function evaluateAuthGuard(
  kernel: AppKernel,
  pageKey: string,
  definition: HostPageDefinition,
  args: unknown[],
): Promise<
  | { effect: "allow" }
  | { effect: "deny" }
  | { effect: "redirect"; redirectTo?: string | undefined; params?: Record<string, string | number | boolean> | undefined }
> {
  if (!shouldEnforceAuthGuard(kernel, definition.guardPolicy)) {
    return { effect: "allow" };
  }

  const existing = await kernel.session.get();
  const existingSession = existing.ok ? existing.value : null;
  const hadSession = Boolean(existingSession?.loggedIn && existingSession.token?.accessToken);
  const hadExpiredSession = isExpiredSession(existingSession);
  const recovered = kernel.auth.recoverSession ? await kernel.auth.recoverSession(existing.ok ? existing.value : undefined) : existing;
  if (recovered.ok && recovered.value) {
    return { effect: "allow" };
  }

  if (definition.guardPolicy?.onFail?.effect === "deny") {
    return { effect: "deny" };
  }

  const current = kernel.router.current();
  const currentParams = current.ok ? current.value?.params : undefined;
  const queryParams = currentParams ?? toRouteParams(args[0]);
  const fallbackReason: AuthRedirectReason = hadSession || hadExpiredSession || !recovered.ok ? "session-expired" : "auth-required";
  const reason = normalizeRedirectReason(definition.guardPolicy?.onFail?.reason, fallbackReason);

  return {
    effect: "redirect",
    ...(definition.guardPolicy?.onFail?.redirectTo ? { redirectTo: definition.guardPolicy.onFail.redirectTo } : {}),
    params: createGuardRedirectParams({
      pageKey,
      definition,
      ...(queryParams ? { routeParams: queryParams } : {}),
      reason,
    }),
  };
}

function createEntry<TController, TBehavior extends HostFeatureBehavior>(
  kernel: AppKernel,
  pageKey: string,
  definition: HostPageDefinition<any, any, TController, any>,
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
      const guardDecision = await evaluateAuthGuard(kernel, pageKey, definition, args);
      if (guardDecision.effect === "deny") {
        return undefined;
      }

      if (guardDecision.effect === "redirect") {
        if (guardDecision.redirectTo) {
          return kernel.router.replace(guardDecision.redirectTo, guardDecision.params);
        }

        return kernel.router.replaceRoute(APP_ROUTE_IDS.login, guardDecision.params);
      }

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
            return createEntry(kernel, pageKey, definition, controller, definition.feature.hosts[host].entryActions);
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
