import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import { createApiApp } from "./app";
import { createMemoryRateLimitCounterStore } from "./rate-limit";
import { createMemoryApiStore } from "./store";

function signPaymentCallback(input: {
  secret?: string;
  orderId: string;
  outcome: string;
  callbackReference: string;
  nonce: string;
  timestamp: number;
  gatewayTransactionId?: string;
}) {
  return createHmac("sha256", input.secret ?? "minix-local-payment-secret")
    .update([
      input.orderId,
      input.outcome,
      input.callbackReference,
      input.nonce,
      String(input.timestamp),
      input.gatewayTransactionId ?? "",
    ].join("\n"))
    .digest("hex");
}

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

async function requestPhoneCode(
  app: ReturnType<typeof createApiApp>,
  phoneNumber: string,
  purpose: "login" | "guest_upgrade" | "phone_binding" | "change_phone" | "password_reset",
) {
  const response = await app.request("http://localhost/auth/verification-code/request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      phoneNumber,
      purpose,
    }),
  });
  assert.equal(response.status, 200);
  const payload = (await response.json()) as { delivery: { debugCode?: string } };
  assert.equal(typeof payload.delivery.debugCode, "string");
  return payload.delivery.debugCode!;
}

async function registerPasswordCredential(
  app: ReturnType<typeof createApiApp>,
  input: { account?: string; phoneNumber?: string; password: string },
) {
  const response = await app.request("http://localhost/auth/password/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  assert.equal(response.status, 200);
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
    accountOperations: Array<{ kind: string; available: boolean }>;
    relationTargets: Array<{ targetUserId: string; actions: Array<{ kind: string }> }>;
  };
  assert.equal(mePayload.userProfile.nickname, "MiniX User");
  assert.equal(mePayload.accountSummary.userId, "minix-demo-user");
  assert.equal(mePayload.userStatus.availability, "enabled");
  assert.equal(mePayload.identityWorkflows.canUpgradeGuest, false);
  assert.equal(mePayload.identityWorkflows.mergePending, false);
  assert.equal(mePayload.accountOperations.some((item) => item.kind === "edit_profile"), true);
  assert.equal(mePayload.relationTargets[0]?.targetUserId, "creator_sample");

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
    messageThread: { threadId: string; type: string; reserved: boolean; unreadCount: number };
    messageItems: Array<{ messageId: string; direction: string; body: string }>;
    detailActions: { canReply: boolean; canMarkRead: boolean };
  };
  assert.equal(threadPayload.messageThread.threadId, "thread_private_tutor");
  assert.equal(threadPayload.messageThread.type, "private");
  assert.equal(threadPayload.messageThread.reserved, true);
  assert.equal(threadPayload.messageItems.length >= 1, true);
  assert.equal(threadPayload.detailActions.canReply, true);
  assert.equal(threadPayload.detailActions.canMarkRead, true);
});

test("account operation endpoints update normalized account and relation state", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "wechat");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };

  const profileResponse = await app.request("http://localhost/account/profile", {
    method: "POST",
    headers,
    body: JSON.stringify({
      nickname: "Account Casey",
      region: "Hangzhou, CN",
      bio: "Updated through the account endpoint.",
    }),
  });
  assert.equal(profileResponse.status, 200);
  const profilePayload = (await profileResponse.json()) as {
    userProfile: { nickname?: string; region?: string };
    transitionMessage: string;
  };
  assert.equal(profilePayload.userProfile.nickname, "Account Casey");
  assert.equal(profilePayload.userProfile.region, "Hangzhou, CN");
  assert.equal(profilePayload.transitionMessage, "Profile updated.");

  const phoneVerificationCode = await requestPhoneCode(app, "13800000022", "change_phone");
  const phoneResponse = await app.request("http://localhost/account/change-phone", {
    method: "POST",
    headers,
    body: JSON.stringify({
      phoneNumber: "13800000022",
      verificationCode: phoneVerificationCode,
    }),
  });
  assert.equal(phoneResponse.status, 200);
  const phonePayload = (await phoneResponse.json()) as {
    accountSummary: { phoneBound: boolean; phoneNumberMasked?: string };
    transitionMessage: string;
  };
  assert.equal(phonePayload.accountSummary.phoneBound, true);
  assert.equal(phonePayload.accountSummary.phoneNumberMasked, "138****0022");
  assert.equal(phonePayload.transitionMessage, "Phone binding updated.");

  const relationResponse = await app.request("http://localhost/account/relations", {
    method: "POST",
    headers,
    body: JSON.stringify({
      targetUserId: "creator_sample",
      action: "set_remark",
      remarkName: "Trusted mentor",
    }),
  });
  assert.equal(relationResponse.status, 200);
  const relationPayload = (await relationResponse.json()) as {
    relationTargets: Array<{ targetUserId: string; remarkName?: string }>;
    transitionMessage: string;
  };
  assert.equal(relationPayload.relationTargets[0]?.targetUserId, "creator_sample");
  assert.equal(relationPayload.relationTargets[0]?.remarkName, "Trusted mentor");
  assert.equal(relationPayload.transitionMessage, "Remark name updated.");

  const cancellationResponse = await app.request("http://localhost/account/cancellation", {
    method: "POST",
    headers,
    body: JSON.stringify({
      confirm: true,
    }),
  });
  assert.equal(cancellationResponse.status, 200);
  const cancellationPayload = (await cancellationResponse.json()) as {
    userStatus: { availability: string; cancellationInProgress: boolean };
    accountOperations: Array<{ kind: string; available: boolean }>;
    transitionMessage: string;
  };
  assert.equal(cancellationPayload.userStatus.availability, "cancellation_pending");
  assert.equal(cancellationPayload.userStatus.cancellationInProgress, true);
  assert.equal(
    cancellationPayload.accountOperations.find((item) => item.kind === "request_cancellation")?.available,
    false,
  );
  assert.equal(cancellationPayload.transitionMessage, "Cancellation request submitted.");

  const settingsResponse = await app.request("http://localhost/settings", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(settingsResponse.status, 200);
  const settingsPayload = (await settingsResponse.json()) as {
    preferences: { account: { phoneEntryLabel: string; cancellationEntryLabel: string } };
  };
  assert.equal(settingsPayload.preferences.account.phoneEntryLabel, "Change phone");
  assert.equal(settingsPayload.preferences.account.cancellationEntryLabel, "Cancellation requested");
});

test("content lifecycle endpoints update generic managed content state", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "wechat");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };

  const detailResponse = await app.request("http://localhost/content/detail?contentId=lesson_2", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(detailResponse.status, 200);
  const detailPayload = (await detailResponse.json()) as {
    contentDetail: { lifecycle: { state: string } };
    contentAccess: { visibility: string };
  };
  assert.equal(detailPayload.contentDetail.lifecycle.state, "draft");
  assert.equal(detailPayload.contentAccess.visibility, "login_required");

  const publishResponse = await app.request("http://localhost/content/lifecycle", {
    method: "POST",
    headers,
    body: JSON.stringify({
      contentId: "lesson_2",
      action: "publish",
    }),
  });
  assert.equal(publishResponse.status, 200);
  const publishPayload = (await publishResponse.json()) as {
    contentCard: { lifecycle: { state: string } };
    transitionMessage: string;
  };
  assert.equal(publishPayload.contentCard.lifecycle.state, "published");
  assert.equal(publishPayload.transitionMessage, "Content published.");

  const visibilityResponse = await app.request("http://localhost/content/lifecycle", {
    method: "POST",
    headers,
    body: JSON.stringify({
      contentId: "lesson_2",
      action: "change_visibility",
      visibility: "member_only",
    }),
  });
  assert.equal(visibilityResponse.status, 200);
  const visibilityPayload = (await visibilityResponse.json()) as {
    contentAccess: { visibility: string; requiresMembership: boolean };
    transitionMessage: string;
  };
  assert.equal(visibilityPayload.contentAccess.visibility, "member_only");
  assert.equal(visibilityPayload.contentAccess.requiresMembership, true);
  assert.equal(visibilityPayload.transitionMessage, "Content visibility updated.");

  const feedResponse = await app.request("http://localhost/feed", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(feedResponse.status, 200);
  const feedPayload = (await feedResponse.json()) as {
    items: Array<{ id: string; contentCard?: { lifecycle: { state: string } }; contentAccess?: { visibility: string } }>;
  };
  assert.equal(feedPayload.items.find((item) => item.id === "lesson_2")?.contentCard?.lifecycle.state, "published");
  assert.equal(feedPayload.items.find((item) => item.id === "lesson_2")?.contentAccess?.visibility, "member_only");
});

test("feed endpoint composes cross-domain search results for user and content scopes", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "wechat");

  const userSearchResponse = await app.request("http://localhost/feed?mode=user&domain=user&keyword=mentor", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(userSearchResponse.status, 200);
  const userSearchPayload = (await userSearchResponse.json()) as {
    items: Array<{ eyebrow?: string; title: string }>;
    searchQuery: { mode: string; domain: string };
    searchResults: { activeDomain?: string; domainTabs?: Array<{ domain: string; total: number }> };
    searchFilters: Array<{ key: string; selectedKeys: string[] }>;
  };
  assert.equal(userSearchPayload.searchQuery.mode, "user");
  assert.equal(userSearchPayload.searchQuery.domain, "user");
  assert.equal(userSearchPayload.items[0]?.eyebrow, "User");
  assert.equal(userSearchPayload.searchResults.activeDomain, "user");
  assert.deepEqual(userSearchPayload.searchFilters[0]?.selectedKeys, ["user"]);
  assert.equal(userSearchPayload.searchResults.domainTabs?.some((item) => item.domain === "user" && item.total >= 1), true);

  const contentSearchResponse = await app.request("http://localhost/feed?mode=content&domain=all&keyword=review", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(contentSearchResponse.status, 200);
  const contentSearchPayload = (await contentSearchResponse.json()) as {
    items: Array<{ id: string; contentCard?: { lifecycle: { state: string } } }>;
    searchQuery: { mode: string; domain: string };
    searchResults: { resultGroups?: Array<{ domain: string; total: number }> };
  };
  assert.equal(contentSearchPayload.searchQuery.mode, "content");
  assert.equal(contentSearchPayload.searchQuery.domain, "all");
  assert.equal(Boolean(contentSearchPayload.items.some((item) => item.contentCard?.lifecycle.state)), true);
  assert.equal(
    contentSearchPayload.searchResults.resultGroups?.some((group) => group.domain === "content" && group.total >= 1),
    true,
  );
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
    recommendedFaqEntries?: Array<{ entryId: string }>;
    supportEntry?: { threadId?: string };
    serviceLoopSummary?: string;
    latestTicket?: { ticketId: string };
  };
  assert.equal(bootstrapPayload.feedbackCategories.length > 0, true);
  assert.equal(bootstrapPayload.feedbackCategories.some((category) => category.key === "product_issue"), true);
  assert.equal(bootstrapPayload.recommendedFaqEntries?.[0]?.entryId, "faq_account_recovery");
  assert.equal(bootstrapPayload.supportEntry?.threadId, "thread_customer_service");
  assert.equal(typeof bootstrapPayload.serviceLoopSummary, "string");
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
        appVersion: "1.0.0",
        deviceSummary: "platform:h5 · version:1.0.0",
        screenshotAssets: [],
        attachmentAssets: [],
      },
    }),
  });
  assert.equal(submitResponse.status, 200);
  const submitPayload = (await submitResponse.json()) as {
    feedbackTicket: { ticketId: string; title: string; revisitRequested: boolean; context: { sourcePage: string } };
    feedbackCategory: { key: string };
    feedbackStatus: {
      state: string;
      processingHistory: Array<{ actorLabel: string }>;
      supportEntry?: { threadId?: string };
      revisitAction?: { enabled: boolean };
    };
  };
  assert.equal(submitPayload.feedbackCategory.key, "product_issue");
  assert.equal(submitPayload.feedbackTicket.title, "Inbox route feels stale after refresh");
  assert.equal(submitPayload.feedbackTicket.revisitRequested, true);
  assert.equal(submitPayload.feedbackTicket.context.sourcePage, "/feedback");
  assert.equal(submitPayload.feedbackStatus.processingHistory.length > 0, true);
  assert.equal(submitPayload.feedbackStatus.supportEntry?.threadId, "thread_customer_service");
  assert.equal(submitPayload.feedbackStatus.revisitAction?.enabled, true);

  const revisitResponse = await app.request("http://localhost/feedback/ticket/revisit", {
    method: "POST",
    headers,
    body: JSON.stringify({
      ticketId: submitPayload.feedbackTicket.ticketId,
      userMessage: "Please re-check after I cleared the local cache and signed in again.",
    }),
  });
  assert.equal(revisitResponse.status, 200);
  const revisitPayload = (await revisitResponse.json()) as {
    feedbackTicket: { ticketId: string; revisitRequested: boolean };
    feedbackStatus: { state: string; processingHistory: Array<{ actorLabel: string; note?: string }> };
  };
  assert.equal(revisitPayload.feedbackTicket.ticketId, submitPayload.feedbackTicket.ticketId);
  assert.equal(revisitPayload.feedbackTicket.revisitRequested, true);
  assert.equal(revisitPayload.feedbackStatus.state, "in_progress");
  assert.equal(
    revisitPayload.feedbackStatus.processingHistory.some((record) => record.actorLabel === "User Follow-up"),
    true,
  );

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
  assert.equal(ticketPayload.feedbackStatus.state, revisitPayload.feedbackStatus.state);

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

test("upload endpoints support session, chunk, complete, attach, retry, and cancel flows", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "h5");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };

  const sessionResponse = await app.request("http://localhost/uploads/session", {
    method: "POST",
    headers,
    body: JSON.stringify({
      scenario: "content",
      selection: {
        uploadTask: {
          taskId: "upload_selection_1",
          scenario: "content",
          fileType: "image",
          stage: "completed",
          fileName: "feedback-screenshot.png",
          progress: {
            completedBytes: 245760,
            totalBytes: 245760,
            percentage: 100,
          },
          chunkingReserved: true,
          governance: {
            maxSizeBytes: 10_000_000,
            acceptedFileTypes: ["image"],
            sensitiveReviewRequired: true,
            expiresInDays: 30,
          },
          reviewStatus: "not_required",
          lifecycle: {
            backendBacked: false,
            retentionStatus: "active",
            retryCount: 0,
            canRetry: true,
            canCancel: false,
          },
        },
        uploadAsset: {
          assetId: "asset_selection_1",
          fileType: "image",
          fileName: "feedback-screenshot.png",
          url: "https://example.test/local/feedback-screenshot.png",
          metadata: {
            sizeBytes: 245760,
            width: 1440,
            height: 900,
          },
        },
      },
    }),
  });
  assert.equal(sessionResponse.status, 200);
  const created = (await sessionResponse.json()) as {
    source: string;
    session?: { sessionId: string; nextChunkIndex: number };
    transfer?: {
      fileChecksum: string;
      checksumAlgorithm: "sha256";
      chunks: Array<{
        chunkIndex: number;
        byteOffset: number;
        byteLength: number;
        checksum: string;
        checksumAlgorithm: "sha256";
        dataBase64: string;
      }>;
    };
    uploadTask: {
      taskId: string;
      stage: string;
      chunkingReserved: boolean;
      uploadedChunkCount?: number;
      lifecycle: { backendBacked: boolean; canCancel: boolean };
    };
    uploadAsset?: { assetId: string; url: string };
  };
  assert.equal(created.source, "backend_session");
  assert.equal(created.uploadTask.stage, "uploading");
  assert.equal(created.uploadTask.lifecycle.backendBacked, true);
  assert.equal(created.uploadTask.lifecycle.canCancel, true);
  assert.equal(created.uploadTask.chunkingReserved, false);
  assert.equal(created.session?.nextChunkIndex, 0);
  assert.equal(created.transfer?.chunks.length, 4);
  assert.equal(Boolean(created.uploadAsset?.assetId), true);

  const firstChunkResponse = await app.request("http://localhost/uploads/chunk", {
    method: "POST",
    headers,
    body: JSON.stringify({
      taskId: created.uploadTask.taskId,
      sessionId: created.session?.sessionId,
      chunk: created.transfer?.chunks[0],
    }),
  });
  assert.equal(firstChunkResponse.status, 200);
  const firstChunk = (await firstChunkResponse.json()) as {
    source: string;
    uploadTask: { stage: string; uploadedChunkCount?: number; progress: { completedBytes: number } };
  };
  assert.equal(firstChunk.source, "backend_chunk");
  assert.equal(firstChunk.uploadTask.stage, "uploading");
  assert.equal(firstChunk.uploadTask.uploadedChunkCount, 1);
  assert.equal(firstChunk.uploadTask.progress.completedBytes > 0, true);

  for (const chunk of created.transfer?.chunks.slice(1) ?? []) {
    const chunkResponse = await app.request("http://localhost/uploads/chunk", {
      method: "POST",
      headers,
      body: JSON.stringify({
        taskId: created.uploadTask.taskId,
        sessionId: created.session?.sessionId,
        chunk,
      }),
    });
    assert.equal(chunkResponse.status, 200);
  }

  const completeResponse = await app.request("http://localhost/uploads/complete", {
    method: "POST",
    headers,
    body: JSON.stringify({
      taskId: created.uploadTask.taskId,
      sessionId: created.session?.sessionId,
      fileChecksum: created.transfer?.fileChecksum,
      checksumAlgorithm: created.transfer?.checksumAlgorithm,
    }),
  });
  assert.equal(completeResponse.status, 200);
  const completed = (await completeResponse.json()) as {
    source: string;
    uploadTask: { stage: string; reviewStatus: string; lifecycle: { canCancel: boolean } };
    uploadAsset?: { assetId: string; metadata?: { checksum?: string } };
  };
  assert.equal(completed.source, "backend_complete");
  assert.equal(completed.uploadTask.stage, "reviewing");
  assert.equal(completed.uploadTask.reviewStatus, "pending");
  assert.equal(completed.uploadTask.lifecycle.canCancel, true);
  assert.equal(completed.uploadAsset?.metadata?.checksum, created.transfer?.fileChecksum);

  const attachResponse = await app.request("http://localhost/uploads/attach", {
    method: "POST",
    headers,
    body: JSON.stringify({
      taskId: created.uploadTask.taskId,
      reference: {
        ownerType: "content",
        ownerId: "lesson_1",
        role: "cover",
      },
    }),
  });
  assert.equal(attachResponse.status, 200);
  const attached = (await attachResponse.json()) as {
    source: string;
    references?: Array<{ ownerType: string; ownerId: string; role: string }>;
  };
  assert.equal(attached.source, "backend_attach");
  assert.equal(attached.references?.[0]?.ownerType, "content");
  assert.equal(attached.references?.[0]?.ownerId, "lesson_1");

  const assetResponse = await app.request(`http://localhost/uploads/assets/${completed.uploadAsset?.assetId}`, {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(assetResponse.status, 200);

  const cancelResponse = await app.request("http://localhost/uploads/cancel", {
    method: "POST",
    headers,
    body: JSON.stringify({
      taskId: created.uploadTask.taskId,
      reason: "user_cancelled",
    }),
  });
  assert.equal(cancelResponse.status, 200);
  const cancelled = (await cancelResponse.json()) as {
    source: string;
    uploadTask: { stage: string; lifecycle: { canRetry: boolean; retentionStatus: string } };
    uploadError?: { code: string };
  };
  assert.equal(cancelled.source, "backend_cancel");
  assert.equal(cancelled.uploadTask.stage, "canceled");
  assert.equal(cancelled.uploadTask.lifecycle.canRetry, true);
  assert.equal(cancelled.uploadTask.lifecycle.retentionStatus, "scheduled_cleanup");
  assert.equal(cancelled.uploadError?.code, "UPLOAD_CANCELLED");

  const retryResponse = await app.request("http://localhost/uploads/retry", {
    method: "POST",
    headers,
    body: JSON.stringify({
      taskId: created.uploadTask.taskId,
    }),
  });
  assert.equal(retryResponse.status, 200);
  const retried = (await retryResponse.json()) as {
    source: string;
    session?: { nextChunkIndex: number };
    transfer?: { chunks: unknown[] };
    uploadTask: { stage: string; lifecycle: { retryCount: number; canCancel: boolean } };
  };
  assert.equal(retried.source, "backend_retry");
  assert.equal(retried.uploadTask.stage, "uploading");
  assert.equal(retried.uploadTask.lifecycle.retryCount, 1);
  assert.equal(retried.uploadTask.lifecycle.canCancel, true);
  assert.equal(retried.session?.nextChunkIndex, 4);
  assert.equal(retried.transfer?.chunks.length, 4);
});

test("share endpoints preserve attribution through prepare and return recognition", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "h5");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };

  const prepareResponse = await app.request("http://localhost/share/prepare", {
    method: "POST",
    headers,
    body: JSON.stringify({
      sharePayload: {
        scenario: "invite",
        title: "Invite a friend to MiniX",
        landingPath: "/login",
        trackingParams: {
          channel: "host-h5",
          campaign: "invite",
        },
        channelMarker: "host-h5-demo",
        inviteCode: "MINIX42",
      },
      shareChannel: {
        kind: "copy_link",
        label: "Copy Link",
        executable: true,
      },
      shareAttribution: {
        inviteBindingEnabled: true,
        returnFlowRecognized: false,
        shareCount: 0,
        clickCount: 0,
        conversionCount: 0,
      },
      redirectTarget: {
        path: "/workspace/media-tools",
        source: "media-tools",
        reason: "auth-required",
      },
    }),
  });
  assert.equal(prepareResponse.status, 200);
  const prepared = (await prepareResponse.json()) as {
    landingTarget: { path?: string; shortLink?: string; authRedirect?: { path?: string; source?: string } };
    sharePayload: { shareToken?: string; shortLink?: string };
    shareAttribution: { attributionId?: string; preparedAt?: string };
  };
  assert.equal(prepared.landingTarget.path, "/login");
  assert.equal(Boolean(prepared.landingTarget.shortLink), true);
  assert.equal(prepared.landingTarget.authRedirect?.path, "/workspace/media-tools");
  assert.equal(Boolean(prepared.sharePayload.shareToken), true);
  assert.equal(Boolean(prepared.shareAttribution.attributionId), true);
  assert.equal(Boolean(prepared.shareAttribution.preparedAt), true);

  const returnResponse = await app.request("http://localhost/share/return", {
    method: "POST",
    headers,
    body: JSON.stringify({
      attributionId: prepared.shareAttribution.attributionId,
      outcome: "conversion",
      recognizedPath: "/login",
      recognizedUserId: session.userId,
    }),
  });
  assert.equal(returnResponse.status, 200);
  const recognized = (await returnResponse.json()) as {
    shareAttribution: {
      returnFlowRecognized: boolean;
      clickCount: number;
      conversionCount: number;
      inviteBoundUserId?: string;
      lastLandingPath?: string;
    };
  };
  assert.equal(recognized.shareAttribution.returnFlowRecognized, true);
  assert.equal(recognized.shareAttribution.clickCount, 1);
  assert.equal(recognized.shareAttribution.conversionCount, 1);
  assert.equal(recognized.shareAttribution.inviteBoundUserId, session.userId);
  assert.equal(recognized.shareAttribution.lastLandingPath, "/login");
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

test("pending membership orders can be cancelled before payment completion", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "h5");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };

  const purchaseResponse = await app.request("http://localhost/membership/purchase", {
    method: "POST",
    headers,
    body: JSON.stringify({
      planId: "monthly",
      paymentScenario: "pending",
      source: "reader",
    }),
  });
  assert.equal(purchaseResponse.status, 200);
  const purchase = (await purchaseResponse.json()) as {
    order: { orderId: string; status: string };
    paymentResult: { status: string; paid: boolean };
  };
  assert.equal(purchase.order.status, "pending_payment");
  assert.equal(purchase.paymentResult.status, "pending");
  assert.equal(purchase.paymentResult.paid, false);

  const cancelResponse = await app.request("http://localhost/orders/cancel", {
    method: "POST",
    headers,
    body: JSON.stringify({
      orderId: purchase.order.orderId,
      reason: "user_cancelled",
    }),
  });
  assert.equal(cancelResponse.status, 200);
  const cancelled = (await cancelResponse.json()) as {
    order: { status: string };
    paymentResult: { status: string; paid: boolean };
    reconciliation: { status: string };
    operationResult: { operation: string; applied: boolean };
  };
  assert.equal(cancelled.order.status, "cancelled");
  assert.equal(cancelled.paymentResult.status, "cancelled");
  assert.equal(cancelled.paymentResult.paid, false);
  assert.equal(cancelled.reconciliation.status, "reconciled");
  assert.equal(cancelled.operationResult.operation, "cancel");
  assert.equal(cancelled.operationResult.applied, true);
});

test("pending membership orders can be confirmed by callback and reconciled", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "h5");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };

  const purchaseResponse = await app.request("http://localhost/membership/purchase", {
    method: "POST",
    headers,
    body: JSON.stringify({
      planId: "quarterly",
      paymentScenario: "pending",
      source: "reader",
    }),
  });
  const purchase = (await purchaseResponse.json()) as {
    order: { orderId: string; status: string };
  };

  const callbackResponse = await app.request("http://localhost/payments/callback", {
    method: "POST",
    headers,
    body: JSON.stringify({
      orderId: purchase.order.orderId,
      outcome: "success",
      verified: true,
      callbackReference: "cb_sample_success",
    }),
  });
  assert.equal(callbackResponse.status, 200);
  const confirmed = (await callbackResponse.json()) as {
    order: { status: string };
    paymentResult: { status: string; paid: boolean; callbackVerified: boolean };
    callbackVerification: { status: string; callbackReference?: string };
  };
  assert.equal(confirmed.order.status, "paid");
  assert.equal(confirmed.paymentResult.status, "success");
  assert.equal(confirmed.paymentResult.paid, true);
  assert.equal(confirmed.paymentResult.callbackVerified, true);
  assert.equal(confirmed.callbackVerification.status, "verified");
  assert.equal(confirmed.callbackVerification.callbackReference, "cb_sample_success");

  const reconcileResponse = await app.request("http://localhost/payments/reconcile", {
    method: "POST",
    headers,
    body: JSON.stringify({
      orderId: purchase.order.orderId,
    }),
  });
  assert.equal(reconcileResponse.status, 200);
  const reconciled = (await reconcileResponse.json()) as {
    reconciliation: { status: string };
    operationResult: { operation: string; applied: boolean };
  };
  assert.equal(reconciled.reconciliation.status, "reconciled");
  assert.equal(reconciled.operationResult.operation, "reconcile");
  assert.equal(reconciled.operationResult.applied, true);
});

test("production payment callbacks require signatures, reject replay, and persist ledgers", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "h5");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };

  const purchaseResponse = await app.request("http://localhost/membership/purchase", {
    method: "POST",
    headers,
    body: JSON.stringify({
      planId: "annual",
      channel: "h5_pay",
      providerMode: "production",
      paymentScenario: "pending",
      idempotencyKey: "prod-ledger-annual",
      source: "reader",
    }),
  });
  assert.equal(purchaseResponse.status, 200);
  const purchase = (await purchaseResponse.json()) as {
    order: { orderId: string };
    paymentIntent: {
      gatewayReference?: { providerMode: string; provider: string; gatewayOrderId: string };
      gatewayResponse?: { paymentUrl?: string; signature: string };
    };
  };
  assert.equal(purchase.paymentIntent.gatewayReference?.providerMode, "production");
  assert.equal(purchase.paymentIntent.gatewayReference?.provider, "h5_gateway");
  assert.ok(purchase.paymentIntent.gatewayResponse?.paymentUrl);
  assert.ok(purchase.paymentIntent.gatewayResponse?.signature);

  const duplicatePurchaseResponse = await app.request("http://localhost/membership/purchase", {
    method: "POST",
    headers,
    body: JSON.stringify({
      planId: "annual",
      channel: "h5_pay",
      providerMode: "production",
      paymentScenario: "pending",
      idempotencyKey: "prod-ledger-annual",
      source: "reader",
    }),
  });
  assert.equal(duplicatePurchaseResponse.status, 200);
  const duplicatePurchase = (await duplicatePurchaseResponse.json()) as {
    order: { orderId: string; duplicateProtected: boolean };
    paymentResult: { duplicateProtected: boolean };
  };
  assert.equal(duplicatePurchase.order.orderId, purchase.order.orderId);
  assert.equal(duplicatePurchase.order.duplicateProtected, true);
  assert.equal(duplicatePurchase.paymentResult.duplicateProtected, true);

  const unsignedResponse = await app.request("http://localhost/payments/callback", {
    method: "POST",
    headers,
    body: JSON.stringify({
      orderId: purchase.order.orderId,
      outcome: "success",
      callbackReference: "cb_unsigned",
    }),
  });
  assert.equal(unsignedResponse.status, 400);

  const timestamp = Date.now();
  const nonce = "nonce-prod-ledger-1";
  const callbackReference = "cb_prod_success";
  const gatewayTransactionId = "gw_txn_prod_1";
  const signature = signPaymentCallback({
    orderId: purchase.order.orderId,
    outcome: "success",
    callbackReference,
    nonce,
    timestamp,
    gatewayTransactionId,
  });
  const signedResponse = await app.request("http://localhost/payments/callback", {
    method: "POST",
    headers,
    body: JSON.stringify({
      orderId: purchase.order.orderId,
      outcome: "success",
      callbackReference,
      gatewayTransactionId,
      nonce,
      timestamp,
      signature,
    }),
  });
  assert.equal(signedResponse.status, 200);
  const signed = (await signedResponse.json()) as {
    order: { status: string };
    paymentIntent: { gatewayReference?: { gatewayTransactionId?: string } };
    paymentLedger?: Array<{ kind: string; status: string }>;
    operationLedger?: Array<{ kind: string }>;
    callbackLedger?: Array<{ verificationStatus: string; replayProtected: boolean }>;
  };
  assert.equal(signed.order.status, "paid");
  assert.equal(signed.paymentIntent.gatewayReference?.gatewayTransactionId, gatewayTransactionId);
  assert.equal(signed.callbackLedger?.at(-1)?.verificationStatus, "verified");
  assert.equal(signed.callbackLedger?.at(-1)?.replayProtected, true);
  assert.equal(signed.paymentLedger?.some((entry) => entry.kind === "callback" && entry.status === "success"), true);
  assert.equal(signed.operationLedger?.some((entry) => entry.kind === "operation"), true);

  const replayResponse = await app.request("http://localhost/payments/callback", {
    method: "POST",
    headers,
    body: JSON.stringify({
      orderId: purchase.order.orderId,
      outcome: "success",
      callbackReference,
      gatewayTransactionId,
      nonce,
      timestamp,
      signature,
    }),
  });
  assert.equal(replayResponse.status, 400);

  const detailResponse = await app.request(`http://localhost/orders/detail?orderId=${purchase.order.orderId}`, {
    headers,
  });
  assert.equal(detailResponse.status, 200);
  const detail = (await detailResponse.json()) as {
    callbackLedger?: Array<{ verificationStatus: string }>;
  };
  assert.equal(detail.callbackLedger?.at(-1)?.verificationStatus, "rejected");
});

test("paid membership orders can enter the refund flow", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "h5");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };

  const purchaseResponse = await app.request("http://localhost/membership/purchase", {
    method: "POST",
    headers,
    body: JSON.stringify({
      planId: "annual",
      source: "reader",
    }),
  });
  const purchase = (await purchaseResponse.json()) as {
    order: { orderId: string };
  };

  const refundResponse = await app.request("http://localhost/orders/refund", {
    method: "POST",
    headers,
    body: JSON.stringify({
      orderId: purchase.order.orderId,
      reason: "duplicate_charge",
    }),
  });
  assert.equal(refundResponse.status, 200);
  const refunded = (await refundResponse.json()) as {
    order: { status: string };
    paymentResult: { status: string; paid: boolean };
    entitlement?: { active: boolean; statusLabel: string };
  };
  assert.equal(refunded.order.status, "refunded");
  assert.equal(refunded.paymentResult.status, "refunded");
  assert.equal(refunded.paymentResult.paid, false);
  assert.equal(refunded.entitlement?.active, false);
  assert.equal(refunded.entitlement?.statusLabel, "Refunded");
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

test("message thread endpoints support read transitions and outbound replies", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "h5");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };

  const beforeResponse = await app.request("http://localhost/messages/thread?threadId=thread_consultation_case", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(beforeResponse.status, 200);
  const before = (await beforeResponse.json()) as {
    messageThread: { unreadCount: number };
    messageItems: Array<{ body: string }>;
  };
  assert.equal(before.messageThread.unreadCount >= 1, true);
  assert.equal(before.messageItems.length >= 1, true);

  const readResponse = await app.request("http://localhost/messages/thread/read", {
    method: "POST",
    headers,
    body: JSON.stringify({
      threadId: "thread_consultation_case",
    }),
  });
  assert.equal(readResponse.status, 200);
  const markedRead = (await readResponse.json()) as {
    messageThread: { unreadCount: number };
    detailActions: { canMarkRead: boolean };
    unreadBadge: { threadUnread: number };
  };
  assert.equal(markedRead.messageThread.unreadCount, 0);
  assert.equal(markedRead.detailActions.canMarkRead, false);
  assert.equal(markedRead.unreadBadge.threadUnread >= 0, true);

  const sendResponse = await app.request("http://localhost/messages/thread/send", {
    method: "POST",
    headers,
    body: JSON.stringify({
      threadId: "thread_consultation_case",
      body: "Please escalate this consultation case.",
    }),
  });
  assert.equal(sendResponse.status, 200);
  const sent = (await sendResponse.json()) as {
    messageThread: { lastMessagePreview?: string };
    messageItem: { direction: string; senderRole: string; body: string; deliveryStatus: string };
  };
  assert.equal(sent.messageItem.direction, "outbound");
  assert.equal(sent.messageItem.senderRole, "self");
  assert.equal(sent.messageItem.body, "Please escalate this consultation case.");
  assert.equal(sent.messageItem.deliveryStatus, "sent");
  assert.equal(sent.messageThread.lastMessagePreview, "Please escalate this consultation case.");
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

test("phone verification login accepts a requested code and binds the phone identity", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const verificationCode = await requestPhoneCode(app, "13800000001", "login");

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
        verificationCode,
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

test("password login uses stored credentials and oauth validates callback state", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  await registerPasswordCredential(app, {
    account: "minix-demo",
    password: "minix-demo-pass",
  });

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

  const validPassword = await app.request("http://localhost/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      platform: "h5",
      credential: {
        method: "password",
        account: "minix-demo",
        password: "minix-demo-pass",
      },
    }),
  });
  assert.equal(validPassword.status, 200);

  const authorizeResponse = await app.request("http://localhost/auth/oauth/authorize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      provider: "wechat-open-platform",
    }),
  });
  assert.equal(authorizeResponse.status, 200);
  const authorizePayload = (await authorizeResponse.json()) as { state: string };

  const oauthResponse = await app.request("http://localhost/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      platform: "h5",
      credential: {
        method: "oauth",
        provider: "wechat-open-platform",
        providerToken: "oauth-token-valid",
        providerUserId: "provider-user-1",
        oauthState: authorizePayload.state,
      },
    }),
  });
  assert.equal(oauthResponse.status, 200);
  const oauthBody = (await oauthResponse.json()) as { loginMethod: string; identity: { userId: string; wechatBound?: boolean } };
  assert.equal(oauthBody.loginMethod, "oauth");
  assert.equal(oauthBody.identity.userId, "user_oauth_wechat-open-platform_provider-user-1");
  assert.equal(oauthBody.identity.wechatBound, true);
});

test("login can return an abnormal-login prompt for suspicious risk context", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  await registerPasswordCredential(app, {
    account: "minix-demo",
    password: "minix-demo-pass",
  });

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
    riskDecision?: { level: string; reason?: string };
  };
  assert.equal(payload.abnormalLoginPrompt?.title, "Unusual sign-in detected");
  assert.equal(payload.abnormalLoginPrompt?.severity, "warning");
  assert.equal(payload.riskDecision?.level, "review");
});

test("guest upgrade can promote a guest session into a formal account and expose workflow state", async () => {
  const store = createMemoryApiStore();
  const app = createApiApp({ store });
  const guestSession = await login(app, "h5");
  const verificationCode = await requestPhoneCode(app, "13800000022", "guest_upgrade");

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
        verificationCode,
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
  const verificationCode = await requestPhoneCode(app, "13800000001", "phone_binding");

  const bindResponse = await app.request("http://localhost/auth/identity/bind-phone", {
    method: "POST",
    headers: {
      authorization: `Bearer ${session.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      phoneNumber: "13800000001",
      verificationCode,
    }),
  });

  assert.equal(bindResponse.status, 200);
  const bindPayload = (await bindResponse.json()) as {
    identity: { userId: string };
    identityWorkflow: {
      kind: string;
      status: string;
      stage?: string;
      workflowId?: string;
      targetUserId?: string;
      failureReason?: string;
      mergePreview?: { requiresConfirmation: boolean; impacts: Array<{ key: string }> };
      audit?: Array<{ action: string }>;
    };
  };
  assert.equal(bindPayload.identity.userId, "minix-demo-user");
  assert.equal(bindPayload.identityWorkflow.kind, "phone_binding");
  assert.equal(bindPayload.identityWorkflow.status, "merge_required");
  assert.equal(bindPayload.identityWorkflow.stage, "preview");
  assert.ok(bindPayload.identityWorkflow.workflowId);
  assert.equal(bindPayload.identityWorkflow.targetUserId, "user_phone_0001");
  assert.equal(bindPayload.identityWorkflow.failureReason, "merge_confirmation_required");
  assert.equal(bindPayload.identityWorkflow.mergePreview?.requiresConfirmation, true);
  assert.deepEqual(
    bindPayload.identityWorkflow.mergePreview?.impacts.map((impact) => impact.key),
    ["assets", "messages", "feedback", "content", "relationships"],
  );
  assert.deepEqual(
    bindPayload.identityWorkflow.audit?.map((record) => record.action),
    ["preview_created", "merge_required"],
  );
});

test("account merge can finalize a pending identity merge into the target account", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "wechat");
  const verificationCode = await requestPhoneCode(app, "13800000001", "phone_binding");

  const bindResponse = await app.request("http://localhost/auth/identity/bind-phone", {
    method: "POST",
    headers: {
      authorization: `Bearer ${session.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      phoneNumber: "13800000001",
      verificationCode,
    }),
  });
  const bindPayload = (await bindResponse.json()) as {
    identityWorkflow: { workflowId?: string; targetUserId?: string };
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
    identityWorkflow: {
      kind: string;
      status: string;
      stage?: string;
      workflowId?: string;
      targetUserId?: string;
      mergePreview?: { targetUserId: string; impacts: Array<{ key: string }> };
      audit?: Array<{ action: string }>;
    };
    accessToken: string;
  };
  assert.equal(mergePayload.identity.userId, "user_phone_0001");
  assert.equal(mergePayload.identity.mergedUserId, "minix-demo-user");
  assert.equal(mergePayload.identityWorkflow.kind, "account_merge");
  assert.equal(mergePayload.identityWorkflow.status, "completed");
  assert.equal(mergePayload.identityWorkflow.stage, "completed");
  assert.equal(mergePayload.identityWorkflow.workflowId, bindPayload.identityWorkflow.workflowId);
  assert.equal(mergePayload.identityWorkflow.targetUserId, "user_phone_0001");
  assert.equal(mergePayload.identityWorkflow.mergePreview?.targetUserId, "user_phone_0001");
  assert.deepEqual(
    mergePayload.identityWorkflow.mergePreview?.impacts.map((impact) => impact.key),
    ["assets", "messages", "feedback", "content", "relationships"],
  );
  assert.deepEqual(
    mergePayload.identityWorkflow.audit?.map((record) => record.action),
    ["preview_created", "merge_required", "merge_confirmed", "merge_completed"],
  );

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

test("account merge cancellation keeps the source session recoverable and records rollback-safe audit", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "wechat");
  const verificationCode = await requestPhoneCode(app, "13800000001", "phone_binding");

  const bindResponse = await app.request("http://localhost/auth/identity/bind-phone", {
    method: "POST",
    headers: {
      authorization: `Bearer ${session.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      phoneNumber: "13800000001",
      verificationCode,
    }),
  });
  const bindPayload = (await bindResponse.json()) as {
    identityWorkflow: { targetUserId?: string };
  };

  const cancelResponse = await app.request("http://localhost/auth/identity/merge", {
    method: "POST",
    headers: {
      authorization: `Bearer ${session.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      targetUserId: bindPayload.identityWorkflow.targetUserId,
      workflowKind: "phone_binding",
      confirm: false,
    }),
  });

  assert.equal(cancelResponse.status, 200);
  const cancelPayload = (await cancelResponse.json()) as {
    identity: { userId: string };
    identityWorkflow: {
      kind: string;
      status: string;
      stage?: string;
      failureReason?: string;
      audit?: Array<{ action: string }>;
    };
  };
  assert.equal(cancelPayload.identity.userId, "minix-demo-user");
  assert.equal(cancelPayload.identityWorkflow.kind, "phone_binding");
  assert.equal(cancelPayload.identityWorkflow.status, "blocked");
  assert.equal(cancelPayload.identityWorkflow.stage, "failed");
  assert.equal(cancelPayload.identityWorkflow.failureReason, "merge_confirmation_required");
  assert.deepEqual(
    cancelPayload.identityWorkflow.audit?.map((record) => record.action),
    ["preview_created", "merge_required", "merge_blocked", "rollback_safe_failure"],
  );
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
