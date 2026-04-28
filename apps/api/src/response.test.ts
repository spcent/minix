import assert from "node:assert/strict";
import test from "node:test";

import { escapeXml } from "./http/response";

test("escapeXml escapes XML text and attribute metacharacters", () => {
  assert.equal(
    escapeXml(`A&B <draft> "quote" 'single'`),
    "A&amp;B &lt;draft&gt; &quot;quote&quot; &apos;single&apos;",
  );
});
