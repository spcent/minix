import test from "node:test";
import assert from "node:assert/strict";

import { createStore } from "@minix/core";

import { createWechatPageBridge } from "./page.bridge";

test("page bridge binds store state to setData and delegates methods", async () => {
  const calls: Array<Record<string, unknown>> = [];
  const entry = {
    controller: {
      store: createStore({
        title: "Login",
        loading: false,
      }),
    },
    async tapLogin() {
      entry.controller.store.setState({ loading: true });
    },
  };

  const page = createWechatPageBridge({
    initialData: {
      title: "Login",
      loading: false,
    },
    async loadEntry() {
      return entry;
    },
    methods: {
      async onTapLogin(current) {
        await current.tapLogin();
      },
    },
  });

  const pageInstance = {
    setData(data: Record<string, unknown>) {
      calls.push(data);
    },
  };

  await page.onLoad?.call(pageInstance);
  await (page.onTapLogin as (() => Promise<void>)).call(pageInstance);

  assert.deepEqual(calls[0], { title: "Login", loading: false });
  assert.deepEqual(calls[calls.length - 1], { title: "Login", loading: true });
});
