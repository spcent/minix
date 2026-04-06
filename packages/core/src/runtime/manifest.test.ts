import assert from "node:assert/strict";
import test from "node:test";

import { APP_ROUTE_IDS } from "@minix/contracts";

import { defineHostPageDefinitions, type FeatureManifest, type HostFeatureBehavior } from "./index";

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
      renderMode: "custom",
    },
  });

  assert.equal(definitions.login.routePath, "/login");
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
