import test from "node:test";
import assert from "node:assert/strict";

import { escapeHtml } from "./html";

test("escapeHtml escapes text and attribute metacharacters", () => {
  assert.equal(escapeHtml(`Tom & "Jerry" <cat> 'mouse'`), "Tom &amp; &quot;Jerry&quot; &lt;cat&gt; &#39;mouse&#39;");
});

test("escapeHtml does not alter safe text", () => {
  assert.equal(escapeHtml("Daily English Studio"), "Daily English Studio");
});
