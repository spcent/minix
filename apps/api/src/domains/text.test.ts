import test from "node:test";
import assert from "node:assert/strict";

import { formatTitleTokenLabel, formatTokenLabel } from "./text";

test("formatTokenLabel normalizes underscores hyphens whitespace and case", () => {
  assert.equal(formatTokenLabel(" subscription_message "), "subscription message");
  assert.equal(formatTokenLabel("WECHAT-TEMPLATE"), "wechat template");
  assert.equal(formatTokenLabel("push__provider"), "push provider");
});

test("formatTokenLabel returns the fallback for empty values", () => {
  assert.equal(formatTokenLabel(undefined, "unknown"), "unknown");
  assert.equal(formatTokenLabel("   ", "unknown"), "unknown");
});

test("formatTitleTokenLabel returns title-case token labels", () => {
  assert.equal(formatTitleTokenLabel("payment_callback"), "Payment Callback");
  assert.equal(formatTitleTokenLabel("in-app"), "In App");
});
