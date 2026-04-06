import test from "node:test";
import assert from "node:assert/strict";

import { novelWechatApp } from "./app";

test("novel wechat app bridge exposes bootstrap config", () => {
  assert.equal(typeof novelWechatApp.onLaunch, "function");
});
