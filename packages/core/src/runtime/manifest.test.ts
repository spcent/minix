import assert from "node:assert/strict";
import test from "node:test";

import { APP_ROUTE_IDS } from "@minix/contracts";

import { ok } from "../error/index";

import { readAuthRedirectTarget } from "./auth-redirect";
import type { AppKernel } from "./app";
import { createManifestPageRegistry, defineHostPageDefinitions, type FeatureManifest, type HostFeatureBehavior } from "./index";

const testFeatureManifest: FeatureManifest<Record<string, never>, Record<string, never>, Record<string, never>> = {
  featureKey: "test",
  pageKey: "login",
  packageName: "@minix/feature-test",
  exportName: "testFeatureManifest",
  createController() {
    return {};
  },
  hosts: {
    h5: {
      entryActions: {},
    },
    wechat: {
      entryActions: {},
    },
  },
};

type TypedManifestController = {
  loadInitial(): Promise<void>;
  refresh(): Promise<void>;
  rename(nextName: string): Promise<void>;
};

const typedManifestBehavior: HostFeatureBehavior<TypedManifestController> = {
  entryActions: {
    onShow: "loadInitial",
    onPullDownRefresh: "refresh",
  },
};

void typedManifestBehavior;

const invalidMissingActionBehavior: HostFeatureBehavior<TypedManifestController> = {
  entryActions: {
    // @ts-expect-error entry actions must reference controller methods that exist
    onShow: "missingAction",
  },
};

void invalidMissingActionBehavior;

const argumentActionBehavior: HostFeatureBehavior<TypedManifestController> = {
  entryActions: {
    onTapRename: "rename",
  },
};

void argumentActionBehavior;

test("defineHostPageDefinitions keeps valid definitions unchanged", () => {
  const definitions = defineHostPageDefinitions({
    login: {
      feature: testFeatureManifest,
      routeId: APP_ROUTE_IDS.login,
      routePath: "/login",
      controller: {},
      pageData: {},
      requiredCapabilities: [{ capability: "device" }],
      guardPolicy: {
        requirements: {
          authenticated: false,
        },
      },
      featureConfig: {
        surface: "public",
      },
      renderMode: "custom",
    },
  });

  assert.equal(definitions.login.routePath, "/login");
});

test("defineHostPageDefinitions rejects unknown required capabilities", () => {
  assert.throws(
    () =>
      defineHostPageDefinitions({
        login: {
          feature: testFeatureManifest,
          routeId: APP_ROUTE_IDS.login,
          routePath: "/login",
          controller: {},
          pageData: {},
          requiredCapabilities: [{ capability: "unsupported-capability" as "device" }],
        },
      }),
    /unknown capability/,
  );
});

test("defineHostPageDefinitions rejects incomplete wechat shell metadata", () => {
  assert.throws(
    () =>
      defineHostPageDefinitions({
        login: {
          feature: testFeatureManifest,
          routeId: APP_ROUTE_IDS.login,
          routePath: "/pages/login/index",
          controller: {},
          pageData: {},
          miniprogramPage: "pages/login/index",
        },
      }),
    /registrationModule is required/,
  );
});

test("manifest guard redirects protected deep links with centralized recovery metadata", async () => {
  const routeCalls: Array<{ routeId: string; params?: Record<string, string | number | boolean> }> = [];
  const controller = {
    async loadInitial() {
      throw new Error("guarded controller action should not run");
    },
  };
  const protectedFeatureManifest: FeatureManifest<Record<string, never>, Record<string, never>, typeof controller> = {
    featureKey: "messages",
    pageKey: "messages",
    packageName: "@minix/feature-messages",
    exportName: "messagesFeatureManifest",
    createController() {
      return controller;
    },
    hosts: {
      h5: {
        entryActions: {
          onShow: "loadInitial",
        },
      },
      wechat: {
        entryActions: {
          onShow: "loadInitial",
        },
      },
    },
  };
  const definitions = defineHostPageDefinitions({
    messages: {
      feature: protectedFeatureManifest,
      routeId: APP_ROUTE_IDS.messages,
      routePath: "/inbox",
      controller: {},
      pageData: {},
      navigationBarTitleText: "Inbox",
      guardPolicy: {
        name: "force-message-reauth",
        requirements: {
          authenticated: true,
        },
        onFail: {
          effect: "redirect",
          reason: "force-relogin",
        },
      },
    },
  });
  const kernel = {
    features: {
      enableAutoLogin: false,
      enableRouteGuard: true,
    },
    auth: {
      async recoverSession() {
        return ok(null);
      },
    },
    router: {
      current() {
        return ok({
          path: "/inbox",
          params: {
            threadId: "support_1",
          },
        });
      },
      async replaceRoute(routeId: string, params?: Record<string, string | number | boolean>) {
        routeCalls.push({ routeId, ...(params ? { params } : {}) });
        return ok(undefined);
      },
    },
  } as unknown as AppKernel;

  const registry = createManifestPageRegistry("h5", kernel, definitions);
  const entry = registry.messages.createEntry();
  const onShow = entry.onShow;
  if (typeof onShow !== "function") {
    throw new Error("onShow entry action was not registered");
  }
  await onShow();

  const routeCall = routeCalls[0];
  assert.ok(routeCall);
  assert.ok(routeCall.params);
  assert.equal(routeCall.routeId, APP_ROUTE_IDS.login);
  assert.deepEqual(readAuthRedirectTarget({ path: "/", params: routeCall.params }), {
    routeId: APP_ROUTE_IDS.messages,
    path: "/inbox",
    params: {
      threadId: "support_1",
    },
    source: "messages",
    label: "Inbox",
    reason: "force-relogin",
    forceReauth: true,
  });
});
