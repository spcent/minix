import test from "node:test";
import assert from "node:assert/strict";

import {
  buildProviderUrl,
  normalizeProviderBaseUrl,
  resolveConfiguredProviderBaseUrl,
} from "./provider-posture";

test("normalizeProviderBaseUrl trims values and adds a trailing slash", () => {
  assert.equal(normalizeProviderBaseUrl(" https://cdn.example.com/assets "), "https://cdn.example.com/assets/");
  assert.equal(normalizeProviderBaseUrl("https://cdn.example.com/assets/"), "https://cdn.example.com/assets/");
});

test("resolveConfiguredProviderBaseUrl rejects empty and invalid configured urls", () => {
  assert.equal(resolveConfiguredProviderBaseUrl(undefined), undefined);
  assert.equal(resolveConfiguredProviderBaseUrl("  "), undefined);
  assert.equal(resolveConfiguredProviderBaseUrl("not a url"), undefined);
  assert.equal(resolveConfiguredProviderBaseUrl("https://cdn.example.com/base"), "https://cdn.example.com/base/");
});

test("buildProviderUrl prefers valid configured bases and falls back to request urls", () => {
  assert.equal(
    buildProviderUrl({
      path: "poster.svg",
      requestUrl: "https://api.example.com/share/prepare",
      configuredBaseUrl: "https://cdn.example.com/posters",
      fallbackPath: "/share-posters/poster.svg",
    }),
    "https://cdn.example.com/posters/poster.svg",
  );

  assert.equal(
    buildProviderUrl({
      path: "poster.svg",
      requestUrl: "https://api.example.com/share/prepare",
      configuredBaseUrl: "bad url",
      fallbackPath: "/share-posters/poster.svg",
    }),
    "https://api.example.com/share-posters/poster.svg",
  );
});
