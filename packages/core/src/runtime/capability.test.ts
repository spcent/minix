import assert from "node:assert/strict";
import test from "node:test";

import { resolveCapabilityPayloadText, resolveShareTargetText } from "./capability";

test("resolveCapabilityPayloadText returns text payloads only", () => {
  assert.equal(
    resolveCapabilityPayloadText({
      capability: "clipboard",
      action: "writeText",
      payload: { text: "copy target" },
    }),
    "copy target",
  );
  assert.equal(
    resolveCapabilityPayloadText({
      capability: "clipboard",
      action: "writeText",
      payload: { text: 123 },
    }),
    null,
  );
  assert.equal(resolveCapabilityPayloadText({ capability: "clipboard", action: "writeText" }), null);
});

test("resolveShareTargetText prefers poster, short link, landing URL, then title", () => {
  assert.equal(
    resolveShareTargetText({
      shareChannel: { kind: "poster_image" },
      sharePayload: {
        posterImageUrl: "https://cdn.example.com/poster.png",
        shortLink: "https://s.example/a",
      },
    }),
    "https://cdn.example.com/poster.png",
  );
  assert.equal(
    resolveShareTargetText({
      sharePayload: {
        shortLink: "https://s.example/a",
        landingUrl: "https://example.com/page",
      },
    }),
    "https://s.example/a",
  );
  assert.equal(resolveShareTargetText({ sharePayload: { landingUrl: "https://example.com/page" } }), "https://example.com/page");
  assert.equal(resolveShareTargetText({ sharePayload: { title: "Untitled share" } }), "Untitled share");
  assert.equal(resolveShareTargetText({}), "");
});
