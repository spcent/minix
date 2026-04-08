import assert from "node:assert/strict";
import test from "node:test";

import { createApiApp } from "./app";
import { createMemoryRateLimitCounterStore } from "./rate-limit";
import { createMemoryApiStore } from "./store";

async function login(app: ReturnType<typeof createApiApp>, platform: "h5" | "wechat") {
  const response = await app.request("http://localhost/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
    },
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
  assert.equal(loginPayload.identity.userId, "guest_media-check-user");
  assert.equal(loginPayload.session.accessToken, loginPayload.accessToken);

  const novelsResponse = await app.request("http://localhost/novels?page=1&pageSize=1", {
    headers: { authorization: `Bearer ${loginPayload.accessToken}` },
  });
  assert.equal(novelsResponse.status, 200);
  const novelsPayload = (await novelsResponse.json()) as {
    items: Array<{
      coverUrl?: string;
      contentCard: { model: string; display: { recommendationSlotLabel?: string } };
      contentAccess: { visibility: string };
    }>;
    searchQuery: { domain: string };
    searchResults: { total: number };
  };
  assert.equal(novelsPayload.items[0]?.coverUrl, "http://localhost/sample-assets/covers/novel-lantern.svg");
  assert.equal(novelsPayload.items[0]?.contentCard.model, "novel_story");
  assert.equal(Boolean(novelsPayload.items[0]?.contentCard.display.recommendationSlotLabel), true);
  assert.equal(novelsPayload.items[0]?.contentAccess.visibility, "public");
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
    identityWorkflows: { canUpgradeGuest: boolean; mergePending: boolean };
  };
  assert.equal(mePayload.userProfile.nickname, "MiniX User");
  assert.equal(mePayload.accountSummary.userId, "minix-demo-user");
  assert.equal(mePayload.userStatus.availability, "enabled");
  assert.equal(mePayload.identityWorkflows.canUpgradeGuest, false);
  assert.equal(mePayload.identityWorkflows.mergePending, false);

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

  const notificationsResponse = await app.request("http://localhost/notifications?type=system&onlyUnread=true", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(notificationsResponse.status, 200);
  const notificationsPayload = (await notificationsResponse.json()) as {
    notificationList: {
      items: Array<{ id: string; type: string; receipt: { read: boolean } }>;
      filters: Array<{ key: string; selectedKeys: string[] }>;
      onlyUnread: boolean;
    };
    messageThread?: { threadId: string; type: string };
    unreadBadge: { totalUnread: number; notificationUnread: number; threadUnread: number };
    reservedThreads: Array<{ threadId: string; type: string }>;
  };
  assert.equal(notificationsPayload.notificationList.onlyUnread, true);
  assert.equal(notificationsPayload.notificationList.items.every((item) => item.type === "system"), true);
  assert.equal(notificationsPayload.notificationList.items.every((item) => item.receipt.read === false), true);
  assert.deepEqual(notificationsPayload.notificationList.filters.find((group) => group.key === "type")?.selectedKeys, ["system"]);
  assert.equal(Boolean(notificationsPayload.messageThread?.threadId), true);
  assert.equal(notificationsPayload.reservedThreads.length >= 1, true);
  assert.equal(notificationsPayload.unreadBadge.totalUnread > notificationsPayload.unreadBadge.notificationUnread, true);

  const unreadBadgeResponse = await app.request("http://localhost/messages/unread-badge", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(unreadBadgeResponse.status, 200);
  const unreadBadgePayload = (await unreadBadgeResponse.json()) as {
    totalUnread: number;
    threadUnread: number;
  };
  assert.equal(unreadBadgePayload.totalUnread >= unreadBadgePayload.threadUnread, true);

  const threadResponse = await app.request("http://localhost/messages/thread?threadId=thread_private_tutor", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(threadResponse.status, 200);
  const threadPayload = (await threadResponse.json()) as {
    messageThread: { threadId: string; type: string; reserved: boolean };
  };
  assert.equal(threadPayload.messageThread.threadId, "thread_private_tutor");
  assert.equal(threadPayload.messageThread.type, "private");
  assert.equal(threadPayload.messageThread.reserved, true);
});

test("feedback bootstrap, submit, and ticket detail endpoints expose the shared ticket model", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "h5");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };

  const bootstrapResponse = await app.request("http://localhost/feedback/bootstrap", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(bootstrapResponse.status, 200);
  const bootstrapPayload = (await bootstrapResponse.json()) as {
    feedbackCategories: Array<{ key: string; type: string }>;
    latestTicket?: { ticketId: string };
  };
  assert.equal(bootstrapPayload.feedbackCategories.length > 0, true);
  assert.equal(bootstrapPayload.feedbackCategories.some((category) => category.key === "product_issue"), true);
  assert.equal(bootstrapPayload.latestTicket, undefined);

  const submitResponse = await app.request("http://localhost/feedback", {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "issue_report",
      categoryKey: "product_issue",
      title: "Inbox route feels stale after refresh",
      description: "After refresh, the inbox badge kept the previous unread count for one render.",
      revisitRequested: true,
      context: {
        sourcePage: "/feedback",
        sourceRouteId: "feedback.form",
        sourceLabel: "Feedback page",
        userId: session.userId,
        platform: "h5",
        appVersion: "0.1.0",
        deviceSummary: "platform:h5 · version:0.1.0",
        screenshotAssets: [],
        attachmentAssets: [],
      },
    }),
  });
  assert.equal(submitResponse.status, 200);
  const submitPayload = (await submitResponse.json()) as {
    feedbackTicket: { ticketId: string; title: string; revisitRequested: boolean; context: { sourcePage: string } };
    feedbackCategory: { key: string };
    feedbackStatus: { state: string; processingHistory: Array<{ actorLabel: string }> };
  };
  assert.equal(submitPayload.feedbackCategory.key, "product_issue");
  assert.equal(submitPayload.feedbackTicket.title, "Inbox route feels stale after refresh");
  assert.equal(submitPayload.feedbackTicket.revisitRequested, true);
  assert.equal(submitPayload.feedbackTicket.context.sourcePage, "/feedback");
  assert.equal(submitPayload.feedbackStatus.processingHistory.length > 0, true);

  const ticketResponse = await app.request(
    `http://localhost/feedback/ticket?ticketId=${submitPayload.feedbackTicket.ticketId}`,
    {
      headers: { authorization: `Bearer ${session.accessToken}` },
    },
  );
  assert.equal(ticketResponse.status, 200);
  const ticketPayload = (await ticketResponse.json()) as {
    feedbackTicket: { ticketId: string };
    feedbackStatus: { state: string };
  };
  assert.equal(ticketPayload.feedbackTicket.ticketId, submitPayload.feedbackTicket.ticketId);
  assert.equal(ticketPayload.feedbackStatus.state, submitPayload.feedbackStatus.state);

  const refreshedBootstrapResponse = await app.request("http://localhost/feedback/bootstrap", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(refreshedBootstrapResponse.status, 200);
  const refreshedBootstrapPayload = (await refreshedBootstrapResponse.json()) as {
    latestTicket?: { ticketId: string };
    latestCategory?: { key: string };
  };
  assert.equal(refreshedBootstrapPayload.latestTicket?.ticketId, submitPayload.feedbackTicket.ticketId);
  assert.equal(refreshedBootstrapPayload.latestCategory?.key, "product_issue");
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

test("notification batch read persists unread state transitions", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "wechat");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };

  const markReadResponse = await app.request("http://localhost/notifications/mark-read", {
    method: "POST",
    headers,
    body: JSON.stringify({
      notificationIds: ["notice_system_security", "notice_business_payment"],
      page: 1,
      pageSize: 6,
      type: "all",
      onlyUnread: false,
    }),
  });
  assert.equal(markReadResponse.status, 200);
  const markReadPayload = (await markReadResponse.json()) as {
    updatedIds: string[];
    unreadBadge: { notificationUnread: number };
    notificationList: { items: Array<{ id: string; receipt: { read: boolean } }> };
  };
  assert.deepEqual(markReadPayload.updatedIds, ["notice_system_security", "notice_business_payment"]);
  assert.equal(markReadPayload.unreadBadge.notificationUnread >= 0, true);
  assert.equal(markReadPayload.notificationList.items.find((item) => item.id === "notice_system_security")?.receipt.read, true);

  const unreadOnlyResponse = await app.request("http://localhost/notifications?onlyUnread=true", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(unreadOnlyResponse.status, 200);
  const unreadOnlyPayload = (await unreadOnlyResponse.json()) as {
    notificationList: { items: Array<{ id: string }> };
  };
  assert.equal(unreadOnlyPayload.notificationList.items.some((item) => item.id === "notice_system_security"), false);
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
  const body = (await limitedResponse.json()) as { code: string; retryAfterSeconds: number };
  assert.equal(body.code, "RATE_LIMITED");
  assert.equal(body.retryAfterSeconds, 60);
});

test("phone verification login accepts the demo code and binds the phone identity", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });

  const response = await app.request("http://localhost/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.77",
    },
    body: JSON.stringify({
      platform: "h5",
      credential: {
        method: "phone_code",
        phoneNumber: "13800000001",
        verificationCode: "123456",
      },
    }),
  });

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    authStatus: string;
    loginMethod: string;
    identity: { userId: string; phoneBound?: boolean };
  };
  assert.equal(payload.authStatus, "authenticated");
  assert.equal(payload.loginMethod, "phone_code");
  assert.equal(payload.identity.userId, "user_phone_0001");
  assert.equal(payload.identity.phoneBound, true);
});

test("password login rejects invalid credentials and oauth remains explicitly reserved", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });

  const invalidPassword = await app.request("http://localhost/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      platform: "h5",
      credential: {
        method: "password",
        account: "minix-demo",
        password: "wrong-pass",
      },
    }),
  });
  assert.equal(invalidPassword.status, 400);
  const invalidPasswordBody = (await invalidPassword.json()) as { code: string; message: string };
  assert.equal(invalidPasswordBody.code, "LOGIN_FAILED");
  assert.equal(invalidPasswordBody.message, "invalid account or password");

  const oauthResponse = await app.request("http://localhost/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      platform: "h5",
      credential: {
        method: "oauth",
        provider: "wechat-open-platform",
        providerToken: "oauth-token",
      },
    }),
  });
  assert.equal(oauthResponse.status, 501);
  const oauthBody = (await oauthResponse.json()) as { code: string };
  assert.equal(oauthBody.code, "PLATFORM_UNSUPPORTED");
});

test("login can return an abnormal-login prompt for suspicious risk context", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });

  const response = await app.request("http://localhost/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      platform: "h5",
      credential: {
        method: "password",
        account: "minix-demo",
        password: "minix-demo-pass",
        deviceId: "device-risk-review",
      },
      riskContext: {
        scene: "suspicious-login",
        ipRegion: "unusual-region",
      },
    }),
  });

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    abnormalLoginPrompt?: { title: string; severity: string };
  };
  assert.equal(payload.abnormalLoginPrompt?.title, "Unusual sign-in detected");
  assert.equal(payload.abnormalLoginPrompt?.severity, "warning");
});

test("guest upgrade can promote a guest session into a formal account and expose workflow state", async () => {
  const store = createMemoryApiStore();
  const app = createApiApp({ store });
  const guestSession = await login(app, "h5");

  const upgradeResponse = await app.request("http://localhost/auth/identity/upgrade", {
    method: "POST",
    headers: {
      authorization: `Bearer ${guestSession.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      credential: {
        method: "phone_code",
        phoneNumber: "13800000022",
        verificationCode: "123456",
      },
      redirectTarget: {
        path: "/items",
        source: "account",
      },
    }),
  });

  assert.equal(upgradeResponse.status, 200);
  const upgradePayload = (await upgradeResponse.json()) as {
    accessToken: string;
    authStatus: string;
    identity: { userId: string; phoneBound?: boolean };
    identityWorkflow: { kind: string; status: string; targetUserId?: string };
  };
  assert.equal(upgradePayload.authStatus, "authenticated");
  assert.equal(upgradePayload.identity.userId, "user_phone_0022");
  assert.equal(upgradePayload.identity.phoneBound, true);
  assert.equal(upgradePayload.identityWorkflow.kind, "guest_upgrade");
  assert.equal(upgradePayload.identityWorkflow.status, "completed");
  assert.equal(upgradePayload.identityWorkflow.targetUserId, "user_phone_0022");

  const meResponse = await app.request("http://localhost/me", {
    headers: { authorization: `Bearer ${upgradePayload.accessToken}` },
  });
  assert.equal(meResponse.status, 200);
  const mePayload = (await meResponse.json()) as {
    accountSummary: { userId: string; phoneBound: boolean; phoneNumberMasked?: string };
    identityWorkflows: { lastWorkflow?: { kind: string; status: string } };
  };
  assert.equal(mePayload.accountSummary.userId, "user_phone_0022");
  assert.equal(mePayload.accountSummary.phoneBound, true);
  assert.equal(mePayload.accountSummary.phoneNumberMasked, "138****0022");
  assert.equal(mePayload.identityWorkflows.lastWorkflow?.kind, "guest_upgrade");
  assert.equal(mePayload.identityWorkflows.lastWorkflow?.status, "completed");
});

test("phone binding can surface a merge-required workflow before merge confirmation", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "wechat");

  const bindResponse = await app.request("http://localhost/auth/identity/bind-phone", {
    method: "POST",
    headers: {
      authorization: `Bearer ${session.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      phoneNumber: "13800000001",
      verificationCode: "123456",
    }),
  });

  assert.equal(bindResponse.status, 200);
  const bindPayload = (await bindResponse.json()) as {
    identity: { userId: string };
    identityWorkflow: { kind: string; status: string; targetUserId?: string; failureReason?: string };
  };
  assert.equal(bindPayload.identity.userId, "minix-demo-user");
  assert.equal(bindPayload.identityWorkflow.kind, "phone_binding");
  assert.equal(bindPayload.identityWorkflow.status, "merge_required");
  assert.equal(bindPayload.identityWorkflow.targetUserId, "user_phone_0001");
  assert.equal(bindPayload.identityWorkflow.failureReason, "merge_confirmation_required");
});

test("account merge can finalize a pending identity merge into the target account", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "wechat");

  const bindResponse = await app.request("http://localhost/auth/identity/bind-phone", {
    method: "POST",
    headers: {
      authorization: `Bearer ${session.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      phoneNumber: "13800000001",
      verificationCode: "123456",
    }),
  });
  const bindPayload = (await bindResponse.json()) as {
    identityWorkflow: { targetUserId?: string };
  };

  const mergeResponse = await app.request("http://localhost/auth/identity/merge", {
    method: "POST",
    headers: {
      authorization: `Bearer ${session.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      targetUserId: bindPayload.identityWorkflow.targetUserId,
      workflowKind: "phone_binding",
      confirm: true,
    }),
  });

  assert.equal(mergeResponse.status, 200);
  const mergePayload = (await mergeResponse.json()) as {
    identity: { userId: string; mergedUserId?: string };
    identityWorkflow: { kind: string; status: string; targetUserId?: string };
    accessToken: string;
  };
  assert.equal(mergePayload.identity.userId, "user_phone_0001");
  assert.equal(mergePayload.identity.mergedUserId, "minix-demo-user");
  assert.equal(mergePayload.identityWorkflow.kind, "account_merge");
  assert.equal(mergePayload.identityWorkflow.status, "completed");
  assert.equal(mergePayload.identityWorkflow.targetUserId, "user_phone_0001");

  const meResponse = await app.request("http://localhost/me", {
    headers: { authorization: `Bearer ${mergePayload.accessToken}` },
  });
  assert.equal(meResponse.status, 200);
  const mePayload = (await meResponse.json()) as {
    accountSummary: { userId: string; phoneBound: boolean };
    identityWorkflows: { mergePending: boolean; lastWorkflow?: { kind: string; status: string } };
  };
  assert.equal(mePayload.accountSummary.userId, "user_phone_0001");
  assert.equal(mePayload.accountSummary.phoneBound, true);
  assert.equal(mePayload.identityWorkflows.mergePending, false);
  assert.equal(mePayload.identityWorkflows.lastWorkflow?.kind, "account_merge");
  assert.equal(mePayload.identityWorkflows.lastWorkflow?.status, "completed");
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
  const detail = (await detailResponse.json()) as {
    id: string;
    inBookshelf?: boolean;
    contentDetail: { model: string; lifecycle: { state: string } };
    contentAccess: { visibility: string; summaryLabel: string };
  };
  assert.equal(detail.id, "novel_brocade");
  assert.equal(detail.contentDetail.model, "novel_story");
  assert.equal(detail.contentDetail.lifecycle.state, "published");
  assert.equal(detail.contentAccess.visibility, "member_only");
  assert.equal(detail.contentAccess.summaryLabel.length > 0, true);

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
