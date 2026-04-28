import test from "node:test";
import assert from "node:assert/strict";

import {
  coerceMockQueryNumber,
  coerceMockQueryString,
  createJsonMockResponse,
  createMockBearerAuthorizationHeader,
  createMockRouteNotFoundError,
  createMockSvgCoverDataUrl,
  matchesMockBearerAuthorizationHeader,
  matchesMockRequestRoute,
  paginateMockItems,
  resolveMockRequestPath,
} from "./mock-request";

test("createJsonMockResponse returns the canonical mock response envelope", () => {
  assert.deepEqual(createJsonMockResponse(200, { ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "x-minix-mock": "true",
    },
    data: { ok: true },
  });
});

test("resolveMockRequestPath keeps absolute and relative mock paths stable", () => {
  assert.equal(resolveMockRequestPath("https://mock.minix.local/items?page=1"), "/items");
  assert.equal(resolveMockRequestPath("/items"), "/items");
});

test("matchesMockRequestRoute checks normalized path and optional method", () => {
  assert.equal(matchesMockRequestRoute({ url: "https://mock.minix.local/items?page=1" }, "/items"), true);
  assert.equal(matchesMockRequestRoute({ url: "/items", method: "GET" }, "/items", "GET"), true);
  assert.equal(matchesMockRequestRoute({ url: "/items", method: "POST" }, "/items", "GET"), false);
  assert.equal(matchesMockRequestRoute({ url: "/other", method: "GET" }, "/items", "GET"), false);
});

test("createMockRouteNotFoundError returns the canonical recoverable mock error", () => {
  assert.deepEqual(createMockRouteNotFoundError("/items", "Host mock route not found"), {
    code: "NOT_FOUND",
    message: "Host mock route not found: /items",
    recoverable: true,
  });
});

test("mock bearer auth helpers build and match authorization headers", () => {
  assert.equal(createMockBearerAuthorizationHeader("mock-token"), "Bearer mock-token");
  assert.equal(matchesMockBearerAuthorizationHeader("Bearer mock-token", "mock-token"), true);
  assert.equal(matchesMockBearerAuthorizationHeader("Bearer other-token", "mock-token"), false);
  assert.equal(matchesMockBearerAuthorizationHeader(undefined, "mock-token"), false);
});

test("createMockSvgCoverDataUrl returns an encoded deterministic svg cover", () => {
  const dataUrl = createMockSvgCoverDataUrl({
    title: "Ashes Of The Lantern",
    accent: "#f4b860",
    backgroundStart: "#0f1d2f",
    backgroundEnd: "#314a5f",
  });
  const [, encodedSvg] = dataUrl.split(",");

  assert.equal(dataUrl.startsWith("data:image/svg+xml;charset=utf-8,"), true);
  assert.ok(encodedSvg);
  assert.equal(decodeURIComponent(encodedSvg).includes("Ashes Of The Lantern cover"), true);
  assert.equal(decodeURIComponent(encodedSvg).includes("#f4b860"), true);
});

test("mock query coercion helpers normalize query values", () => {
  assert.equal(coerceMockQueryNumber(3, 1), 3);
  assert.equal(coerceMockQueryNumber("4", 1), 4);
  assert.equal(coerceMockQueryNumber("bad", 1), 1);
  assert.equal(coerceMockQueryNumber(true, 1), 1);
  assert.equal(coerceMockQueryString("novel"), "novel");
  assert.equal(coerceMockQueryString(""), undefined);
});

test("paginateMockItems returns the canonical mock list envelope", () => {
  assert.deepEqual(paginateMockItems(["a", "b", "c"], { page: "2", pageSize: "1" }), {
    items: ["b"],
    page: 2,
    pageSize: 1,
    hasMore: true,
  });

  assert.deepEqual(paginateMockItems(["a", "b", "c"], undefined, { defaultPageSize: 2 }), {
    items: ["a", "b"],
    page: 1,
    pageSize: 2,
    hasMore: true,
  });

  assert.deepEqual(paginateMockItems(["a", "b", "c"], { page: 2, pageSize: 2 }), {
    items: ["c"],
    page: 2,
    pageSize: 2,
    hasMore: false,
  });
});
