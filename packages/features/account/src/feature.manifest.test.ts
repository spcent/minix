import assert from "node:assert/strict";
import test from "node:test";

import { ok, type AppKernel } from "@minix/core";
import { APP_ROUTE_IDS } from "@minix/contracts";

import { accountFeatureManifest } from "./feature.manifest";
import { createDefaultAccountState } from "./model";

function createKernelStub() {
  const routeCalls: string[] = [];

  const kernel = {
    session: {
      async get() {
        return ok({
          loggedIn: true,
          platform: "h5",
          identity: { userId: "user-1" },
          token: { accessToken: "token-1", expiresAt: Date.now() + 60_000 },
        });
      },
    },
    request: {
      async get<T>() {
        return ok({
          userProfile: {
            nickname: "Casey",
            tags: ["member-ready", "cross-host"],
          },
          accountSummary: {
            userId: "user-1",
            phoneBound: false,
            wechatBound: false,
            realNameStatus: "unverified",
            assets: {
              points: 0,
              level: 1,
              membership: {
                active: false,
                tier: "guest",
                entitlementScope: "none",
                statusLabel: "Guest mode",
                renewalLabel: "Upgrade anytime",
                headline: "Guest",
                subheadline: "Guest",
                benefits: [],
              },
              entitlementLabels: ["basic-access"],
              balanceCents: 0,
            },
            relations: {
              followingCount: 0,
              followerCount: 0,
              friendCount: 0,
              blockedCount: 0,
            },
          },
          userStatus: {
            availability: "enabled",
            enabled: true,
            frozen: false,
            cancellationInProgress: false,
            blacklisted: false,
            guest: false,
          },
          identityWorkflows: {
            canUpgradeGuest: false,
            canBindPhone: false,
            mergePending: false,
          },
        } as T);
      },
    },
    router: {
      async toRoute(routeId: string) {
        routeCalls.push(routeId);
        return ok(undefined);
      },
      async replaceRoute(routeId: string) {
        routeCalls.push(routeId);
        return ok(undefined);
      },
    },
    capability: {
      status() {
        return ok(true);
      },
      async execute(input: { capability: string; action: string }) {
        return ok({
          capability: input.capability,
          action: input.action,
        });
      },
    },
  } as unknown as AppKernel;

  return {
    kernel,
    routeCalls,
  };
}

test("account feature manifest creates a reusable account controller from host page data", async () => {
  const { kernel, routeCalls } = createKernelStub();
  const controller = accountFeatureManifest.createController(
    "h5",
    kernel,
    {
      loginRouteId: APP_ROUTE_IDS.login,
      settingsRouteId: APP_ROUTE_IDS.settings,
      overviewRouteId: APP_ROUTE_IDS.overview,
    },
    createDefaultAccountState(),
  );

  await controller.loadInitial();
  await controller.goToSettings();

  assert.equal(controller.store.getState().subtitle, "Tags: member-ready, cross-host");
  assert.equal(controller.store.getState().stats[0]?.label, "Membership");
  assert.deepEqual(routeCalls, [APP_ROUTE_IDS.settings]);
});
