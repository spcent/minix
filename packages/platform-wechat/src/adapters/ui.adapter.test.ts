import assert from "node:assert/strict";
import test from "node:test";

import { createWechatUiAdapter } from "./ui.adapter";

test("wechat ui adapter delegates toast loading and modal calls to the runtime api", async () => {
  const calls: string[] = [];
  const adapter = createWechatUiAdapter({
    showToast(options) {
      calls.push(`toast:${options.title}:${options.icon ?? "none"}`);
    },
    showLoading(options) {
      calls.push(`loading:${options.title ?? ""}`);
    },
    hideLoading() {
      calls.push("loading:hide");
    },
    showModal(options) {
      calls.push(`modal:${options.title ?? ""}:${options.content}`);
      options.success?.({ confirm: true });
    },
  });

  await adapter.toast({ title: "Saved", icon: "success" });
  await adapter.loading(true, "Syncing");
  await adapter.loading(false);
  const modal = await adapter.modal({
    title: "Sign out",
    content: "Do you want to leave this session?",
  });

  assert.deepEqual(calls, [
    "toast:Saved:success",
    "loading:Syncing",
    "loading:hide",
    "modal:Sign out:Do you want to leave this session?",
  ]);
  assert.deepEqual(modal, { ok: true, value: true });
});
