import assert from "node:assert/strict";
import test from "node:test";

import { ok } from "../error";
import type { RouterAdapter } from "../ports/router";

import { createRouteLocationUrl, createRouteMapper, createRouterService } from "./router";

test("createRouteLocationUrl serializes route params consistently", () => {
  assert.equal(createRouteLocationUrl({ path: "/items" }), "/items");
  assert.equal(
    createRouteLocationUrl({
      path: "/items",
      params: {
        from: "plan",
        page: 2,
        active: true,
      },
    }),
    "/items?from=plan&page=2&active=true",
  );
});

test("router service resolves route ids through a mapper", async () => {
  const calls: Array<{ kind: "push" | "replace"; path: string }> = [];
  const adapter: RouterAdapter = {
    async push(location) {
      calls.push({ kind: "push", path: location.path });
      return ok(undefined);
    },
    async replace(location) {
      calls.push({ kind: "replace", path: location.path });
      return ok(undefined);
    },
    async back() {
      return ok(undefined);
    },
    current() {
      return ok(null);
    },
  };

  const router = createRouterService({
    adapter,
    routeMapper: createRouteMapper({
      "items.list": "/items",
      "settings.index": "/settings",
    }),
  });

  const items = await router.toRoute("items.list");
  const settings = await router.replaceRoute("settings.index");

  assert.deepEqual(items, { ok: true, value: undefined });
  assert.deepEqual(settings, { ok: true, value: undefined });
  assert.deepEqual(calls, [
    { kind: "push", path: "/items" },
    { kind: "replace", path: "/settings" },
  ]);
});

test("router service fails when a route id is missing from the mapper", async () => {
  const adapter: RouterAdapter = {
    async push() {
      return ok(undefined);
    },
    async replace() {
      return ok(undefined);
    },
    async back() {
      return ok(undefined);
    },
    current() {
      return ok(null);
    },
  };

  const router = createRouterService({
    adapter,
    routeMapper: createRouteMapper({
      "auth.login": "/login",
    }),
  });

  const result = await router.toRoute("items.list");

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, "ROUTE_ERROR");
    assert.equal(result.error.detail?.routeId, "items.list");
  }
});
