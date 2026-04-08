import assert from "node:assert/strict";
import test from "node:test";

import { createApiApp } from "./app";
import { createMemoryRateLimitCounterStore } from "./rate-limit";
import { createMemoryApiStore } from "./store";

async function login(app: ReturnType<typeof createApiApp>, platform: "h5" | "wechat") {
  const response = await app.request("http://localhost/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      platform,
      credential: platform === "wechat" ? { code: "wechat-code" } : { anonymousId: "host-h5-anonymous" },
    }),
  });
  assert.equal(response.status, 200);
  return (await response.json()) as {
    accessToken: string;
    refreshToken: string;
    userId: string;
    authStatus: string;
    identity: { userId: string };
    session: { accessToken: string };
  };
}

test("host sample flow supports login, items, refresh, and logout", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "h5");

  const itemsResponse = await app.request("http://localhost/items?page=1&pageSize=2", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(itemsResponse.status, 200);
  const items = (await itemsResponse.json()) as { items: Array<{ id: string }> };
  assert.equal(items.items.length, 2);

  const refreshResponse = await app.request("http://localhost/auth/refresh", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      platform: "h5",
      refreshToken: session.refreshToken,
    }),
  });
  assert.equal(refreshResponse.status, 200);
  const refreshed = (await refreshResponse.json()) as { accessToken: string; refreshToken: string };
  assert.notEqual(refreshed.accessToken, session.accessToken);
  assert.notEqual(refreshed.refreshToken, session.refreshToken);

  const logoutResponse = await app.request("http://localhost/auth/logout", {
    method: "POST",
    headers: {
      authorization: `Bearer ${refreshed.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ refreshToken: refreshed.refreshToken }),
  });
  assert.equal(logoutResponse.status, 200);

  const revokedRefreshResponse = await app.request("http://localhost/auth/refresh", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      platform: "h5",
      refreshToken: refreshed.refreshToken,
    }),
  });
  assert.equal(revokedRefreshResponse.status, 401);
});

test("api echoes the client trace id in responses and errors", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const traceId = "trace-test-001";

  const loginResponse = await app.request("http://localhost/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-trace-id": traceId,
    },
    body: JSON.stringify({
      platform: "h5",
      credential: { anonymousId: "trace-check-user" },
    }),
  });
  assert.equal(loginResponse.status, 200);
  assert.equal(loginResponse.headers.get("x-trace-id"), traceId);

  const unauthorizedResponse = await app.request("http://localhost/items?page=1&pageSize=2", {
    headers: {
      "x-trace-id": traceId,
    },
  });
  assert.equal(unauthorizedResponse.status, 401);
  assert.equal(unauthorizedResponse.headers.get("x-trace-id"), traceId);
});

test("auth and novel responses resolve sample media under the api origin", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });

  const loginResponse = await app.request("http://localhost/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      platform: "h5",
      credential: { anonymousId: "media-check-user" },
    }),
  });
  assert.equal(loginResponse.status, 200);
  const loginPayload = (await loginResponse.json()) as {
    accessToken: string;
    profile: { avatarUrl?: string };
    authStatus: string;
    identity: { userId: string };
    session: { accessToken: string };
  };
  assert.equal(loginPayload.profile.avatarUrl, "http://localhost/sample-assets/profiles/minix-user.svg");
  assert.equal(loginPayload.authStatus, "guest");
  assert.equal(loginPayload.identity.userId, "minix-demo-user");
  assert.equal(loginPayload.session.accessToken, loginPayload.accessToken);

  const novelsResponse = await app.request("http://localhost/novels?page=1&pageSize=1", {
    headers: { authorization: `Bearer ${loginPayload.accessToken}` },
  });
  assert.equal(novelsResponse.status, 200);
  const novelsPayload = (await novelsResponse.json()) as {
    items: Array<{ coverUrl?: string }>;
    searchQuery: { domain: string };
    searchResults: { total: number };
  };
  assert.equal(novelsPayload.items[0]?.coverUrl, "http://localhost/sample-assets/covers/novel-lantern.svg");
  assert.equal(novelsPayload.searchQuery.domain, "novel");
  assert.equal(novelsPayload.searchResults.total >= 1, true);
});

test("current user, settings, and discovery endpoints expose normalized shared outputs", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "wechat");

  const meResponse = await app.request("http://localhost/me", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(meResponse.status, 200);
  const mePayload = (await meResponse.json()) as {
    userProfile: { nickname?: string };
    accountSummary: { userId: string; assets: { membership?: { headline?: string } } };
    userStatus: { availability: string };
  };
  assert.equal(mePayload.userProfile.nickname, "MiniX User");
  assert.equal(mePayload.accountSummary.userId, "minix-demo-user");
  assert.equal(mePayload.userStatus.availability, "enabled");

  const settingsResponse = await app.request("http://localhost/settings", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(settingsResponse.status, 200);
  const settingsPayload = (await settingsResponse.json()) as {
    preferences: { language: string; developerOptions: { logsEnabled: boolean } };
    featureToggles: { accountCenterEnabled: boolean };
    privacyOptions: { profileVisibilityLabel: string };
  };
  assert.equal(settingsPayload.preferences.language, "zh-CN");
  assert.equal(settingsPayload.preferences.developerOptions.logsEnabled, true);
  assert.equal(settingsPayload.featureToggles.accountCenterEnabled, true);
  assert.equal(settingsPayload.privacyOptions.profileVisibilityLabel, "Private to signed-in session");

  const feedResponse = await app.request("http://localhost/feed?keyword=travel&tag=speaking", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(feedResponse.status, 200);
  const feedPayload = (await feedResponse.json()) as {
    searchQuery: { keyword: string; mode: string; domain: string };
    searchFilters: Array<{ key: string; selectedKeys: string[] }>;
    searchResults: { suggestionTerms: string[]; hotKeywords: string[] };
  };
  assert.equal(feedPayload.searchQuery.keyword, "travel");
  assert.equal(feedPayload.searchQuery.mode, "global");
  assert.equal(feedPayload.searchQuery.domain, "feed");
  assert.deepEqual(feedPayload.searchFilters.find((group) => group.key === "tag")?.selectedKeys, ["speaking"]);
  assert.equal(feedPayload.searchResults.hotKeywords.includes("travel"), true);
  assert.equal(feedPayload.searchResults.suggestionTerms.length > 0, true);
});

test("sample asset routes serve generated svg media", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });

  const coverResponse = await app.request("http://localhost/sample-assets/covers/novel-lantern.svg");
  assert.equal(coverResponse.status, 200);
  assert.equal(coverResponse.headers.get("content-type"), "image/svg+xml; charset=utf-8");
  const coverBody = await coverResponse.text();
  assert.match(coverBody, /Ashes Of/);

  const profileResponse = await app.request("http://localhost/sample-assets/profiles/minix-user.svg");
  assert.equal(profileResponse.status, 200);
  const profileBody = await profileResponse.text();
  assert.match(profileBody, /MX/);

  const missingResponse = await app.request("http://localhost/sample-assets/covers/missing.svg");
  assert.equal(missingResponse.status, 404);
});

test("membership purchase reuses the same paid order for a repeated idempotency key", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "wechat");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };

  const firstResponse = await app.request("http://localhost/membership/purchase", {
    method: "POST",
    headers,
    body: JSON.stringify({
      planId: "monthly",
      idempotencyKey: "idem_membership_1",
      source: "reader",
      novelId: "novel_lantern",
      chapterId: "lantern_ch_02",
    }),
  });
  assert.equal(firstResponse.status, 200);
  const first = (await firstResponse.json()) as { order: { orderId: string }; paymentResult: { duplicateProtected: boolean } };
  assert.equal(first.paymentResult.duplicateProtected, false);

  const secondResponse = await app.request("http://localhost/membership/purchase", {
    method: "POST",
    headers,
    body: JSON.stringify({
      planId: "monthly",
      idempotencyKey: "idem_membership_1",
      source: "reader",
      novelId: "novel_lantern",
      chapterId: "lantern_ch_02",
    }),
  });
  assert.equal(secondResponse.status, 200);
  const second = (await secondResponse.json()) as {
    order: { orderId: string };
    paymentResult: { duplicateProtected: boolean; message: string };
  };
  assert.equal(second.order.orderId, first.order.orderId);
  assert.equal(second.paymentResult.duplicateProtected, true);
  assert.match(second.paymentResult.message, /Idempotency key matched/);
});

test("refresh rotation invalidates the previous refresh token", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "h5");

  const refreshResponse = await app.request("http://localhost/auth/refresh", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      platform: "h5",
      refreshToken: session.refreshToken,
    }),
  });
  assert.equal(refreshResponse.status, 200);

  const oldRefreshResponse = await app.request("http://localhost/auth/refresh", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      platform: "h5",
      refreshToken: session.refreshToken,
    }),
  });
  assert.equal(oldRefreshResponse.status, 401);
});

test("expired access tokens can still be refreshed while the refresh token is valid", async () => {
  let currentTime = 1_760_000_000_000;
  const store = createMemoryApiStore({
    now: () => currentTime,
    accessTokenTtlMs: 10,
    refreshTokenTtlMs: 10_000,
  });
  const app = createApiApp({ store });
  const session = await login(app, "h5");

  currentTime += 50;

  const itemsResponse = await app.request("http://localhost/items?page=1&pageSize=2", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(itemsResponse.status, 401);

  const refreshResponse = await app.request("http://localhost/auth/refresh", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      platform: "h5",
      refreshToken: session.refreshToken,
    }),
  });
  assert.equal(refreshResponse.status, 200);
});

test("expired refresh tokens are rejected", async () => {
  let currentTime = 1_760_000_000_000;
  const store = createMemoryApiStore({
    now: () => currentTime,
    accessTokenTtlMs: 10,
    refreshTokenTtlMs: 20,
  });
  const app = createApiApp({ store });
  const session = await login(app, "h5");

  currentTime += 25;

  const refreshResponse = await app.request("http://localhost/auth/refresh", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      platform: "h5",
      refreshToken: session.refreshToken,
    }),
  });
  assert.equal(refreshResponse.status, 401);
});

test("login attempts are rate limited per client and platform", async () => {
  const app = createApiApp({
    store: createMemoryApiStore(),
    authRateLimitConfig: {
      windowSeconds: 60,
      loginMaxAttempts: 2,
      refreshMaxAttempts: 10,
    },
    authRateLimitStore: createMemoryRateLimitCounterStore(),
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await app.request("http://localhost/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": "198.51.100.10",
      },
      body: JSON.stringify({
        platform: "h5",
        credential: { anonymousId: `host-h5-anonymous-${attempt}` },
      }),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-ratelimit-limit"), "2");
  }

  const limitedResponse = await app.request("http://localhost/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": "198.51.100.10",
    },
    body: JSON.stringify({
      platform: "h5",
      credential: { anonymousId: "host-h5-anonymous-blocked" },
    }),
  });

  assert.equal(limitedResponse.status, 429);
  assert.equal(limitedResponse.headers.get("retry-after"), "60");
  assert.equal(limitedResponse.headers.get("x-ratelimit-remaining"), "0");
  const body = (await limitedResponse.json()) as { code: string };
  assert.equal(body.code, "RATE_LIMITED");
});

test("refresh attempts are rate limited per forwarded client ip", async () => {
  const app = createApiApp({
    store: createMemoryApiStore(),
    authRateLimitConfig: {
      windowSeconds: 60,
      loginMaxAttempts: 10,
      refreshMaxAttempts: 1,
    },
    authRateLimitStore: createMemoryRateLimitCounterStore(),
  });
  const session = await login(app, "h5");

  const firstRefreshResponse = await app.request("http://localhost/auth/refresh", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.5, 10.0.0.2",
    },
    body: JSON.stringify({
      platform: "h5",
      refreshToken: session.refreshToken,
    }),
  });
  assert.equal(firstRefreshResponse.status, 200);
  const refreshed = (await firstRefreshResponse.json()) as { refreshToken: string };

  const secondRefreshResponse = await app.request("http://localhost/auth/refresh", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.5, 10.0.0.2",
    },
    body: JSON.stringify({
      platform: "h5",
      refreshToken: refreshed.refreshToken,
    }),
  });

  assert.equal(secondRefreshResponse.status, 429);
  assert.equal(secondRefreshResponse.headers.get("retry-after"), "60");
  assert.equal(secondRefreshResponse.headers.get("x-ratelimit-limit"), "1");
});

test("api replies to local h5 preflight requests with explicit cors headers", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });

  const response = await app.request("http://localhost/items", {
    method: "OPTIONS",
    headers: {
      origin: "http://localhost:4173",
      "access-control-request-method": "GET",
      "access-control-request-headers": "authorization,content-type",
    },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:4173");
  assert.equal(response.headers.get("access-control-allow-headers"), "authorization, content-type, x-trace-id");
  assert.equal(response.headers.get("access-control-allow-methods"), "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  assert.equal(response.headers.get("vary"), "Origin");
});

test("api rejects browser preflight from disallowed origins", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });

  const response = await app.request("http://localhost/items", {
    method: "OPTIONS",
    headers: {
      origin: "http://evil.example",
      "access-control-request-method": "GET",
    },
  });

  assert.equal(response.status, 403);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("api includes cors headers on allowed local h5 responses", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "h5");

  const response = await app.request("http://localhost/items?page=1&pageSize=2", {
    headers: {
      origin: "http://localhost:4174",
      authorization: `Bearer ${session.accessToken}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:4174");
  assert.equal(response.headers.get("vary"), "Origin");
});

test("novel sample flow supports detail, reading progress, bookshelf, and membership purchase", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "wechat");
  const headers = { authorization: `Bearer ${session.accessToken}` };

  const novelsResponse = await app.request("http://localhost/novels?sort=popular&page=1&pageSize=3", { headers });
  assert.equal(novelsResponse.status, 200);
  const novels = (await novelsResponse.json()) as { items: Array<{ id: string }> };
  assert.equal(novels.items.length, 3);

  const detailResponse = await app.request("http://localhost/novels/detail?novelId=novel_brocade", { headers });
  assert.equal(detailResponse.status, 200);
  const detail = (await detailResponse.json()) as { id: string; inBookshelf?: boolean };
  assert.equal(detail.id, "novel_brocade");

  const chaptersResponse = await app.request("http://localhost/chapters?novelId=novel_brocade", { headers });
  assert.equal(chaptersResponse.status, 200);

  const chapterContentResponse = await app.request("http://localhost/chapters/content?chapterId=brocade_ch_01", {
    headers,
  });
  assert.equal(chapterContentResponse.status, 200);

  const progressSaveResponse = await app.request("http://localhost/reading-progress", {
    method: "POST",
    headers: {
      ...headers,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      novelId: "novel_brocade",
      chapterId: "brocade_ch_02",
      progressPercent: 0.5,
      pageIndex: 2,
    }),
  });
  assert.equal(progressSaveResponse.status, 200);

  const progressLoadResponse = await app.request("http://localhost/reading-progress?novelId=novel_brocade", {
    headers,
  });
  assert.equal(progressLoadResponse.status, 200);
  const progress = (await progressLoadResponse.json()) as { progress: { chapterId: string } | null };
  assert.equal(progress.progress?.chapterId, "brocade_ch_02");

  const bookshelfAddResponse = await app.request("http://localhost/bookshelf", {
    method: "POST",
    headers: {
      ...headers,
      "content-type": "application/json",
    },
    body: JSON.stringify({ novelId: "novel_glass" }),
  });
  assert.equal(bookshelfAddResponse.status, 200);

  const membershipPurchaseResponse = await app.request("http://localhost/membership/purchase", {
    method: "POST",
    headers: {
      ...headers,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      planId: "quarterly",
      source: "reader",
      novelId: "novel_brocade",
      chapterId: "brocade_ch_03",
    }),
  });
  assert.equal(membershipPurchaseResponse.status, 200);
  const purchase = (await membershipPurchaseResponse.json()) as {
    overview: { active: boolean };
    order: { orderId: string; status: string };
    paymentIntent: { orderId: string; status: string };
    paymentResult: { orderId: string; status: string; paid: boolean };
    entitlement: { sourceOrderId: string; active: boolean };
  };
  assert.equal(purchase.overview.active, true);
  assert.equal(purchase.order.status, "paid");
  assert.equal(purchase.paymentIntent.orderId, purchase.order.orderId);
  assert.equal(purchase.paymentResult.status, "success");
  assert.equal(purchase.paymentResult.paid, true);
  assert.equal(purchase.entitlement.sourceOrderId, purchase.order.orderId);

  const orderDetailResponse = await app.request(`http://localhost/orders/detail?orderId=${purchase.order.orderId}`, {
    headers,
  });
  assert.equal(orderDetailResponse.status, 200);
  const orderDetail = (await orderDetailResponse.json()) as { order: { orderId: string }; paymentResult: { status: string } };
  assert.equal(orderDetail.order.orderId, purchase.order.orderId);
  assert.equal(orderDetail.paymentResult.status, "success");

  const paymentResultResponse = await app.request(`http://localhost/payments/result?orderId=${purchase.order.orderId}`, {
    headers,
  });
  assert.equal(paymentResultResponse.status, 200);
  const paymentResult = (await paymentResultResponse.json()) as { orderId: string; status: string; paid: boolean };
  assert.equal(paymentResult.orderId, purchase.order.orderId);
  assert.equal(paymentResult.status, "success");
  assert.equal(paymentResult.paid, true);

  const bookshelfResponse = await app.request("http://localhost/bookshelf", { headers });
  assert.equal(bookshelfResponse.status, 200);
  const bookshelf = (await bookshelfResponse.json()) as { items: Array<{ novelId: string }> };
  assert.equal(bookshelf.items.some((item) => item.novelId === "novel_glass"), true);
});
