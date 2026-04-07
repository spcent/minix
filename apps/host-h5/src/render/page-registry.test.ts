import assert from "node:assert/strict";
import test from "node:test";

import { createStore } from "@minix/core";

import type { HostH5Runtime } from "../manifest/app.manifest";
import { activateHostH5Page, resolveHostH5PageKey, subscribeHostH5Pages } from "./page-registry";

test("resolveHostH5PageKey resolves known routes and falls back to login", () => {
  assert.equal(resolveHostH5PageKey("/"), "login");
  assert.equal(resolveHostH5PageKey("/overview"), "overview");
  assert.equal(resolveHostH5PageKey("/plan"), "items");
  assert.equal(resolveHostH5PageKey("/preferences"), "settings");
  assert.equal(resolveHostH5PageKey("/account"), "account");
  assert.equal(resolveHostH5PageKey("/unknown"), "login");
});

test("activateHostH5Page calls onShow when the entry exposes it", async () => {
  let called = 0;

  await activateHostH5Page({
    controller: {},
    async onShow() {
      called += 1;
    },
  } as unknown as ReturnType<HostH5Runtime["registry"]["login"]["createEntry"]>);

  assert.equal(called, 1);
});

test("subscribeHostH5Pages subscribes every store-backed page", () => {
  let calls = 0;

  const runtime = {
    pages: {
      login: {
        store: createStore({ ready: false }),
      },
      overview: {
        store: createStore({ ready: false }),
      },
      items: {
        store: createStore({ ready: false }),
      },
      settings: {
        store: createStore({ ready: false }),
      },
      account: {
        store: createStore({ ready: false }),
      },
    },
  } as unknown as HostH5Runtime;

  const cleanups = subscribeHostH5Pages(runtime, () => {
    calls += 1;
  });

  runtime.pages.login.store.replaceState(runtime.pages.login.store.getState());
  runtime.pages.overview.store.replaceState(runtime.pages.overview.store.getState());
  runtime.pages.items.store.replaceState(runtime.pages.items.store.getState());
  runtime.pages.settings.store.replaceState(runtime.pages.settings.store.getState());
  runtime.pages.account.store.replaceState(runtime.pages.account.store.getState());

  assert.equal(cleanups.length, 5);
  assert.equal(calls, 5);

  cleanups.forEach((cleanup) => cleanup());
});
