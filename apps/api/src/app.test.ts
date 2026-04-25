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
  purpose: "login" | "guest_upgrade" | "phone_binding" | "change_phone" | "password_reset" | "account_security",
  accessToken?: string,
) {
  const response = await app.request("http://localhost/auth/verification-code/request", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": `203.0.113.${Math.floor(Math.random() * 200) + 1}`,
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
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

test("phone verification can use a configured production sms provider without exposing debug codes", async () => {
  const app = createApiApp({
    store: createMemoryApiStore(),
    authSmsProvider: async (input) => ({
      ok: true,
      value: {
        provider: "sms",
        providerMode: "production",
        providerLabel: "Tencent Cloud SMS",
        providerReference: `prod_${input.verificationId}`,
        maskedTarget: input.maskedTarget,
        message: "Verification code issued through the configured SMS provider.",
      },
    }),
  });

  const response = await app.request("http://localhost/auth/verification-code/request", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.33",
    },
    body: JSON.stringify({
      phoneNumber: "13800000001",
      purpose: "password_reset",
    }),
  });
  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    delivery: {
      provider: string;
      providerMode?: string;
      providerLabel?: string;
      debugCode?: string;
      message: string;
    };
  };
  assert.equal(payload.delivery.provider, "sms");
  assert.equal(payload.delivery.providerMode, "production");
  assert.equal(payload.delivery.providerLabel, "Tencent Cloud SMS");
  assert.equal(payload.delivery.debugCode, undefined);
  assert.equal(payload.delivery.message, "Verification code issued through the configured SMS provider.");
});

test("phone verification rejects production mode when no sms provider is configured", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const response = await app.request(
    "http://localhost/auth/verification-code/request",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": "203.0.113.34",
      },
      body: JSON.stringify({
        phoneNumber: "13800000001",
        purpose: "login",
      }),
    },
    {
      MINIX_AUTH_SMS_PROVIDER_MODE: "production",
    } as never,
  );
  assert.equal(response.status, 503);
  const payload = (await response.json()) as {
    code: string;
    message: string;
    credentialProtection?: { failureReason?: string };
  };
  assert.equal(payload.code, "PROVIDER_UNAVAILABLE");
  assert.equal(payload.credentialProtection?.failureReason, "provider_unavailable");
});

test("oauth authorize can use a configured production provider without sample urls", async () => {
  const app = createApiApp({
    store: createMemoryApiStore(),
    authOAuthProvider: {
      authorize: async (input) => ({
        ok: true,
        value: {
          providerMode: "production",
          providerLabel: "WeChat Open Platform",
          authorizationUrl: `https://open.weixin.qq.com/connect/qrconnect?state=${encodeURIComponent(input.state)}`,
          message: "OAuth authorization issued through the configured provider.",
        },
      }),
      validateCallback: async (input) => ({
        ok: true,
        value: {
          providerMode: "production",
          providerLabel: "WeChat Open Platform",
          providerUserId: input.providerUserId,
        },
      }),
    },
  });

  const response = await app.request("http://localhost/auth/oauth/authorize", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      provider: "wechat-open-platform",
    }),
  });
  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    providerMode?: string;
    providerLabel?: string;
    authorizationUrl: string;
    message?: string;
    state: string;
  };
  assert.equal(payload.providerMode, "production");
  assert.equal(payload.providerLabel, "WeChat Open Platform");
  assert.equal(payload.authorizationUrl.includes("auth.example.test"), false);
  assert.equal(payload.authorizationUrl.includes(payload.state), true);
  assert.equal(payload.message, "OAuth authorization issued through the configured provider.");
});

test("oauth authorize rejects production mode when no oauth provider is configured", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const response = await app.request(
    "http://localhost/auth/oauth/authorize",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        provider: "wechat-open-platform",
      }),
    },
    {
      MINIX_AUTH_OAUTH_PROVIDER_MODE: "production",
    } as never,
  );
  assert.equal(response.status, 503);
  const payload = (await response.json()) as {
    code: string;
    credentialProtection?: { failureReason?: string };
  };
  assert.equal(payload.code, "PROVIDER_UNAVAILABLE");
  assert.equal(payload.credentialProtection?.failureReason, "provider_unavailable");
});

test("oauth callback can use a configured production provider to validate the callback token", async () => {
  const app = createApiApp({
    store: createMemoryApiStore(),
    authOAuthProvider: {
      authorize: async (input) => ({
        ok: true,
        value: {
          providerMode: "production",
          providerLabel: "WeChat Open Platform",
          authorizationUrl: `https://open.weixin.qq.com/connect/qrconnect?state=${encodeURIComponent(input.state)}`,
          message: "OAuth authorization issued through the configured provider.",
        },
      }),
      validateCallback: async (input) => ({
        ok: true,
        value: {
          providerMode: "production",
          providerLabel: "WeChat Open Platform",
          providerUserId: `${input.providerUserId}-validated`,
        },
      }),
    },
  });

  const authorizeResponse = await app.request("http://localhost/auth/oauth/authorize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      provider: "wechat-open-platform",
    }),
  });
  assert.equal(authorizeResponse.status, 200);
  const authorizePayload = (await authorizeResponse.json()) as { state: string };

  const callbackResponse = await app.request("http://localhost/auth/oauth/callback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      provider: "wechat-open-platform",
      state: authorizePayload.state,
      providerToken: "oauth-token-valid",
      providerUserId: "provider-user-1",
      platform: "h5",
    }),
  });
  assert.equal(callbackResponse.status, 200);
  const callbackPayload = (await callbackResponse.json()) as { loginMethod: string; identity: { userId: string } };
  assert.equal(callbackPayload.loginMethod, "oauth");
  assert.equal(callbackPayload.identity.userId, "user_oauth_wechat-open-platform_provider-user-1-validate");
});

test("operational diagnostics include provider readiness across auth, messages, payment, upload, and share", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "h5");

  const response = await app.request("http://localhost/ops/diagnostics", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    providerReadiness: {
      auth: {
        sms: { status: string; mode?: string; adapterConfigured: boolean };
        oauth: { status: string; mode?: string; adapterConfigured: boolean };
      };
      messages: {
        touchpoints: { status: string; mode?: string; defaultedProductionChannels: number };
      };
      payment: {
        callbacks: { status: string; webhookSecretConfigured: boolean };
      };
      upload: {
        pipeline: { status: string; mode?: string; storageProviderConfigured: boolean };
      };
      share: {
        distribution: { status: string; mode?: string; shortLinkProviderConfigured: boolean };
      };
    };
  };

  assert.equal(payload.providerReadiness.auth.sms.mode, "sample");
  assert.equal(payload.providerReadiness.auth.sms.status, "sample");
  assert.equal(payload.providerReadiness.auth.sms.adapterConfigured, false);
  assert.equal(payload.providerReadiness.auth.oauth.mode, "sample");
  assert.equal(payload.providerReadiness.auth.oauth.status, "sample");
  assert.equal(payload.providerReadiness.auth.oauth.adapterConfigured, false);
  assert.equal(payload.providerReadiness.messages.touchpoints.mode, "sample");
  assert.equal(payload.providerReadiness.messages.touchpoints.status, "sample");
  assert.equal(payload.providerReadiness.messages.touchpoints.defaultedProductionChannels, 0);
  assert.equal(payload.providerReadiness.payment.callbacks.status, "review");
  assert.equal(payload.providerReadiness.payment.callbacks.webhookSecretConfigured, false);
  assert.equal(payload.providerReadiness.upload.pipeline.mode, "sample");
  assert.equal(payload.providerReadiness.upload.pipeline.status, "sample");
  assert.equal(payload.providerReadiness.upload.pipeline.storageProviderConfigured, false);
  assert.equal(payload.providerReadiness.share.distribution.mode, "sample");
  assert.equal(payload.providerReadiness.share.distribution.status, "sample");
  assert.equal(payload.providerReadiness.share.distribution.shortLinkProviderConfigured, false);
});

test("operational diagnostics reflect production readiness and blocked auth providers explicitly", async () => {
  const app = createApiApp({
    store: createMemoryApiStore(),
    authSmsProvider: async (input) => ({
      ok: true,
      value: {
        provider: "sms",
        providerMode: "production",
        providerLabel: "Tencent Cloud SMS",
        providerReference: `prod_${input.verificationId}`,
        maskedTarget: input.maskedTarget,
        message: "Verification code issued through the configured SMS provider.",
      },
    }),
  });
  const session = await login(app, "h5");

  const response = await app.request(
    "http://localhost/ops/diagnostics",
    {
      headers: { authorization: `Bearer ${session.accessToken}` },
    },
    {
      MINIX_AUTH_SMS_PROVIDER_MODE: "production",
      MINIX_AUTH_OAUTH_PROVIDER_MODE: "production",
      MINIX_MESSAGE_TOUCHPOINT_PROVIDER_MODE: "production",
      MINIX_MESSAGE_SUBSCRIPTION_PROVIDER_KEY: "wechat_sub_prod",
      MINIX_MESSAGE_SUBSCRIPTION_PROVIDER_LABEL: "WeChat Subscription",
      MINIX_MESSAGE_SMS_PROVIDER_KEY: "sms_prod",
      MINIX_MESSAGE_SMS_PROVIDER_LABEL: "Tencent SMS",
      MINIX_MESSAGE_EMAIL_PROVIDER_KEY: "email_prod",
      MINIX_MESSAGE_EMAIL_PROVIDER_LABEL: "Resend",
      MINIX_MESSAGE_PUSH_PROVIDER_KEY: "push_prod",
      MINIX_MESSAGE_PUSH_PROVIDER_LABEL: "JPush",
      MINIX_PAYMENT_WEBHOOK_SECRET: "prod-secret",
      MINIX_UPLOAD_PROVIDER_MODE: "production",
      MINIX_UPLOAD_STORAGE_PROVIDER: "r2-prod",
      MINIX_UPLOAD_REVIEW_PROVIDER: "review-prod",
      MINIX_UPLOAD_ASSET_BASE_URL: "https://assets.example.test/",
      MINIX_SHARE_PROVIDER_MODE: "production",
      MINIX_SHARE_SHORT_LINK_PROVIDER: "short-prod",
      MINIX_SHARE_POSTER_PROVIDER: "poster-prod",
      MINIX_SHARE_SHORT_LINK_BASE_URL: "https://s.example.test/",
      MINIX_SHARE_POSTER_BASE_URL: "https://poster.example.test/",
    } as never,
  );
  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    providerReadiness: {
      auth: {
        sms: { status: string; adapterConfigured: boolean };
        oauth: { status: string; adapterConfigured: boolean };
      };
      messages: {
        touchpoints: { status: string; explicitChannelConfigs: number; defaultedProductionChannels: number };
      };
      payment: {
        callbacks: { status: string; webhookSecretConfigured: boolean };
      };
      upload: {
        pipeline: {
          status: string;
          storageProviderConfigured: boolean;
          reviewProviderConfigured: boolean;
          assetBaseUrlConfigured: boolean;
        };
      };
      share: {
        distribution: {
          status: string;
          shortLinkProviderConfigured: boolean;
          posterProviderConfigured: boolean;
          shortLinkBaseUrlConfigured: boolean;
          posterBaseUrlConfigured: boolean;
        };
      };
    };
  };

  assert.equal(payload.providerReadiness.auth.sms.status, "ready");
  assert.equal(payload.providerReadiness.auth.sms.adapterConfigured, true);
  assert.equal(payload.providerReadiness.auth.oauth.status, "blocked");
  assert.equal(payload.providerReadiness.auth.oauth.adapterConfigured, false);
  assert.equal(payload.providerReadiness.messages.touchpoints.status, "ready");
  assert.equal(payload.providerReadiness.messages.touchpoints.explicitChannelConfigs, 4);
  assert.equal(payload.providerReadiness.messages.touchpoints.defaultedProductionChannels, 0);
  assert.equal(payload.providerReadiness.payment.callbacks.status, "ready");
  assert.equal(payload.providerReadiness.payment.callbacks.webhookSecretConfigured, true);
  assert.equal(payload.providerReadiness.upload.pipeline.status, "ready");
  assert.equal(payload.providerReadiness.upload.pipeline.storageProviderConfigured, true);
  assert.equal(payload.providerReadiness.upload.pipeline.reviewProviderConfigured, true);
  assert.equal(payload.providerReadiness.upload.pipeline.assetBaseUrlConfigured, true);
  assert.equal(payload.providerReadiness.share.distribution.status, "ready");
  assert.equal(payload.providerReadiness.share.distribution.shortLinkProviderConfigured, true);
  assert.equal(payload.providerReadiness.share.distribution.posterProviderConfigured, true);
  assert.equal(payload.providerReadiness.share.distribution.shortLinkBaseUrlConfigured, true);
  assert.equal(payload.providerReadiness.share.distribution.posterBaseUrlConfigured, true);
});

test("oauth login maps production provider validation failures to normalized auth errors", async () => {
  const app = createApiApp({
    store: createMemoryApiStore(),
    authOAuthProvider: {
      authorize: async (input) => ({
        ok: true,
        value: {
          providerMode: "production",
          providerLabel: "WeChat Open Platform",
          authorizationUrl: `https://open.weixin.qq.com/connect/qrconnect?state=${encodeURIComponent(input.state)}`,
          message: "OAuth authorization issued through the configured provider.",
        },
      }),
      validateCallback: async () => ({
        ok: false,
        error: {
          failureReason: "oauth_token_invalid",
          message: "OAuth token could not be validated with the configured provider.",
        },
      }),
    },
  });

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
        providerToken: "oauth-token-invalid",
        providerUserId: "provider-user-1",
        oauthState: authorizePayload.state,
      },
    }),
  });
  assert.equal(oauthResponse.status, 400);
  const oauthPayload = (await oauthResponse.json()) as {
    code: string;
    credentialProtection?: { failureReason?: string };
    message: string;
  };
  assert.equal(oauthPayload.code, "LOGIN_FAILED");
  assert.equal(oauthPayload.credentialProtection?.failureReason, "oauth_token_invalid");
  assert.equal(oauthPayload.message, "OAuth token could not be validated with the configured provider.");
});

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

async function loginWithPhoneCode(app: ReturnType<typeof createApiApp>, phoneNumber: string) {
  const verificationCode = await requestPhoneCode(app, phoneNumber, "login");
  const response = await app.request("http://localhost/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      platform: "h5",
      credential: {
        method: "phone_code",
        phoneNumber,
        verificationCode,
      },
    }),
  });
  assert.equal(response.status, 200);
  return (await response.json()) as {
    accessToken: string;
    refreshToken?: string;
    userId: string;
    identity: { userId: string; phoneBound?: boolean };
  };
}

async function uploadContentAsset(
  app: ReturnType<typeof createApiApp>,
  accessToken: string,
  input: {
    taskId: string;
    assetId: string;
    fileName: string;
  },
) {
  const response = await app.request("http://localhost/uploads", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      scenario: "content",
      selection: {
        uploadTask: {
          taskId: input.taskId,
          scenario: "content",
          fileType: "image",
          stage: "completed",
          fileName: input.fileName,
          progress: {
            completedBytes: 8192,
            totalBytes: 8192,
            percentage: 100,
          },
          chunkingReserved: false,
          governance: {
            maxSizeBytes: 10_000_000,
            acceptedFileTypes: ["image"],
            sensitiveReviewRequired: false,
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
          assetId: input.assetId,
          fileType: "image",
          fileName: input.fileName,
          url: `https://example.test/local/${input.fileName}`,
          metadata: {
            sizeBytes: 8192,
            width: 640,
            height: 480,
          },
        },
      },
    }),
  });
  assert.equal(response.status, 200);
  return (await response.json()) as {
    uploadTask: { taskId: string };
    uploadAsset?: { assetId: string; url: string; thumbnailUrl?: string };
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
      contentCard: { model: string; display: { recommendationSlotLabel?: string; recommendationSummary?: string; laneGovernanceSummary?: string } };
      contentAccess: { visibility: string };
    }>;
    searchQuery: { domain: string };
    searchResults: { total: number };
  };
  assert.equal(novelsPayload.items[0]?.coverUrl, "http://localhost/sample-assets/covers/novel-lantern.svg");
  assert.equal(novelsPayload.items[0]?.contentCard.model, "novel_story");
  assert.equal(Boolean(novelsPayload.items[0]?.contentCard.display.recommendationSlotLabel), true);
  assert.equal(Boolean(novelsPayload.items[0]?.contentCard.display.recommendationSummary), true);
  assert.equal(Boolean(novelsPayload.items[0]?.contentCard.display.laneGovernanceSummary), true);
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
    accountSummary: { userId: string; assets: { membership?: { headline?: string }; historySummary?: string; latestLedgerTitle?: string } };
    userStatus: { availability: string; recoverySummary?: string; cancellationSummary?: string };
    identityWorkflows: { canUpgradeGuest: boolean; mergePending: boolean };
    securityCenter: {
      deviceIdentities: Array<{ deviceId: string }>;
      auditEvents: Array<{ scope: string; action: string }>;
      latestRateLimit?: { scope: string };
      deviceSummary?: { totalDevices: number; reviewRequiredDevices: number };
    };
    accountOperations: Array<{ kind: string; available: boolean }>;
    relationTargets: Array<{ targetUserId: string; actions: Array<{ kind: string }> }>;
  };
  assert.equal(mePayload.userProfile.nickname, "MiniX User");
  assert.equal(mePayload.accountSummary.userId, "minix-demo-user");
  assert.match(mePayload.accountSummary.assets.historySummary ?? "", /ledger entries/i);
  assert.equal(typeof mePayload.accountSummary.assets.latestLedgerTitle, "string");
  assert.equal(mePayload.userStatus.availability, "enabled");
  assert.match(mePayload.userStatus.recoverySummary ?? "", /recovery credential/i);
  assert.match(mePayload.userStatus.cancellationSummary ?? "", /No cancellation request/i);
  assert.equal(mePayload.identityWorkflows.canUpgradeGuest, false);
  assert.equal(mePayload.identityWorkflows.mergePending, false);
  assert.equal(Array.isArray(mePayload.securityCenter.auditEvents), true);
  assert.equal(mePayload.securityCenter.auditEvents.some((event) => event.scope === "auth"), true);
  assert.equal(
    mePayload.securityCenter.deviceSummary
      ? mePayload.securityCenter.deviceSummary.totalDevices >= 1
      : true,
    true,
  );
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
    effectivePolicy: {
      notification: { presetKey?: string; policySourceSummary?: string };
      developer: { policySourceSummary?: string };
    };
    notificationPresets?: Array<{ presetKey: string; active: boolean }>;
  };
  assert.equal(settingsPayload.preferences.language, "zh-CN");
  assert.equal(settingsPayload.preferences.developerOptions.logsEnabled, true);
  assert.equal(settingsPayload.featureToggles.accountCenterEnabled, true);
  assert.equal(settingsPayload.privacyOptions.profileVisibilityLabel, "Visible inside signed-in surfaces only");
  assert.equal(settingsPayload.effectivePolicy.notification.presetKey, "balanced");
  assert.match(settingsPayload.effectivePolicy.notification.policySourceSummary ?? "", /provider readiness/i);
  assert.match(settingsPayload.effectivePolicy.developer.policySourceSummary ?? "", /debug-environment preferences/i);
  assert.equal(settingsPayload.notificationPresets?.some((preset) => preset.presetKey === "balanced" && preset.active), true);

  const feedResponse = await app.request("http://localhost/feed?keyword=travel&tag=speaking", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(feedResponse.status, 200);
  const feedPayload = (await feedResponse.json()) as {
    searchQuery: { keyword: string; mode: string; domain: string };
    searchFilters: Array<{ key: string; selectedKeys: string[]; persistenceScope?: string; reloadBehavior?: string }>;
    searchResults: {
      suggestionTerms: string[];
      hotKeywords: string[];
      activeDomain?: string;
      domainTabs?: Array<{ domain: string; total: number }>;
      resultGroups?: Array<{ domain: string; total: number }>;
      grouping?: { strategy: string };
      zeroResultGuidance?: { state: string };
    };
  };
  assert.equal(feedPayload.searchQuery.keyword, "travel");
  assert.equal(feedPayload.searchQuery.mode, "global");
  assert.equal(feedPayload.searchQuery.domain, "feed");
  assert.deepEqual(feedPayload.searchFilters.find((group) => group.key === "domain")?.selectedKeys, []);
  assert.deepEqual(feedPayload.searchFilters.find((group) => group.key === "tag")?.selectedKeys, ["speaking"]);
  assert.equal(feedPayload.searchFilters.find((group) => group.key === "domain")?.persistenceScope, "route");
  assert.equal(feedPayload.searchFilters.find((group) => group.key === "tag")?.reloadBehavior, "restore");
  assert.equal(feedPayload.searchResults.hotKeywords.includes("travel"), true);
  assert.equal(feedPayload.searchResults.suggestionTerms.length > 0, true);
  assert.equal(feedPayload.searchResults.activeDomain, "feed");
  assert.equal(feedPayload.searchResults.domainTabs?.some((item) => item.domain === "feed" && item.total >= 1), true);
  assert.equal(feedPayload.searchResults.resultGroups?.some((group) => group.domain === "feed" && group.total >= 1), true);
  assert.equal(feedPayload.searchResults.grouping?.strategy, "flat");
  assert.equal(feedPayload.searchResults.zeroResultGuidance?.state, "results");

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

test("settings updates persist and affect notifications, discovery, and upload policy", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "wechat");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };

  const updateResponse = await app.request("http://localhost/settings", {
    method: "POST",
    headers,
    body: JSON.stringify({
      preferences: {
        notificationsEnabled: false,
        device: {
          networkStrategy: "data-saver",
          autoplay: false,
          weakNetworkMode: true,
        },
      },
      featureToggles: {
        pushEnabled: false,
        smsEnabled: true,
        emailEnabled: true,
      },
      privacyOptions: {
        profileVisibility: "public",
        personalizedRecommendations: false,
        analyticsEnabled: false,
      },
    }),
  });
  assert.equal(updateResponse.status, 200);
  const updatedSettings = (await updateResponse.json()) as {
    privacyOptions: { profileVisibility: string; analyticsEnabled: boolean };
    effectivePolicy: {
      notification: { eligibleChannels: string[]; inAppEnabled: boolean; smsEnabled: boolean; emailEnabled: boolean; presetKey?: string };
      device: { autoplayEnabled: boolean; uploadChunkSizeBytes: number; weakNetworkMode: boolean; weakNetworkSummary?: string };
      developer: { policySourceSummary?: string };
    };
    notificationPresets?: Array<{ presetKey: string; active: boolean }>;
  };
  assert.equal(updatedSettings.privacyOptions.profileVisibility, "public");
  assert.equal(updatedSettings.privacyOptions.analyticsEnabled, false);
  assert.deepEqual(updatedSettings.effectivePolicy.notification.eligibleChannels, []);
  assert.equal(updatedSettings.effectivePolicy.notification.inAppEnabled, false);
  assert.equal(updatedSettings.effectivePolicy.notification.smsEnabled, false);
  assert.equal(updatedSettings.effectivePolicy.notification.emailEnabled, false);
  assert.equal(updatedSettings.effectivePolicy.notification.presetKey, "paused");
  assert.equal(updatedSettings.effectivePolicy.device.autoplayEnabled, false);
  assert.equal(updatedSettings.effectivePolicy.device.weakNetworkMode, true);
  assert.equal(updatedSettings.effectivePolicy.device.uploadChunkSizeBytes, 8192);
  assert.match(updatedSettings.effectivePolicy.device.weakNetworkSummary ?? "", /Weak-network mode is active/i);
  assert.match(updatedSettings.effectivePolicy.developer.policySourceSummary ?? "", /debug-environment preferences/i);
  assert.equal(updatedSettings.notificationPresets?.some((preset) => preset.presetKey === "paused" && preset.active), true);

  const notificationsResponse = await app.request("http://localhost/notifications?page=1&pageSize=2", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(notificationsResponse.status, 200);
  const notificationsPayload = (await notificationsResponse.json()) as {
    notificationList: {
      items: Array<{ touchpoints: Array<{ channel: string; enabled: boolean; receipt?: { status: string } }> }>;
    };
  };
  assert.equal(notificationsPayload.notificationList.items[0]?.touchpoints.find((touchpoint) => touchpoint.channel === "in_app")?.enabled, true);
  assert.equal(
    notificationsPayload.notificationList.items[0]?.touchpoints.filter((touchpoint) => touchpoint.channel !== "in_app").every((touchpoint) => touchpoint.enabled === false),
    true,
  );
  assert.equal(
    notificationsPayload.notificationList.items[0]?.touchpoints.find((touchpoint) => touchpoint.channel === "email")?.receipt?.status,
    "skipped",
  );

  const meResponse = await app.request("http://localhost/me", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(meResponse.status, 200);
  const mePayload = (await meResponse.json()) as {
    accountSummary: { relations: { remarkName?: string } };
  };
  assert.equal(mePayload.accountSummary.relations.remarkName, "Coach Lin");

  const userSearchResponse = await app.request("http://localhost/feed?mode=user&domain=user", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(userSearchResponse.status, 200);
  const userSearchPayload = (await userSearchResponse.json()) as {
    searchResults: { items: Array<{ recommendedReason?: string }> };
  };
  assert.equal(userSearchPayload.searchResults.items[0]?.recommendedReason, "This profile is visible across shared discovery surfaces.");

  const feedResponse = await app.request("http://localhost/feed?tag=speaking", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(feedResponse.status, 200);
  const feedPayload = (await feedResponse.json()) as {
    items: Array<{ recommendedReason?: string }>;
  };
  assert.equal(feedPayload.items[0]?.recommendedReason, "Recommended for all signed-in readers.");

  const uploadSessionResponse = await app.request("http://localhost/uploads/session", {
    method: "POST",
    headers,
    body: JSON.stringify({
      scenario: "content",
      selection: {
        uploadTask: {
          taskId: "upload_settings_network",
          scenario: "content",
          fileType: "video",
          stage: "completed",
          fileName: "network-policy-demo.mp4",
          progress: {
            completedBytes: 131072,
            totalBytes: 131072,
            percentage: 100,
          },
          chunkingReserved: false,
          governance: {
            maxSizeBytes: 5000000,
            acceptedFileTypes: ["video"],
            sensitiveReviewRequired: false,
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
          assetId: "asset_settings_network",
          fileType: "video",
          fileName: "network-policy-demo.mp4",
          url: "https://cdn.example.com/network-policy-demo.mp4",
          metadata: {
            mimeType: "video/mp4",
            sizeBytes: 131072,
            durationSeconds: 12,
          },
        },
      },
    }),
  });
  assert.equal(uploadSessionResponse.status, 200);
  const uploadSessionPayload = (await uploadSessionResponse.json()) as {
    session?: { chunkSizeBytes: number };
    transfer?: { chunkSizeBytes: number };
  };
  assert.equal(uploadSessionPayload.session?.chunkSizeBytes, 8192);
  assert.equal(uploadSessionPayload.transfer?.chunkSizeBytes, 8192);

  const refreshResponse = await app.request("http://localhost/auth/refresh", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      platform: "wechat",
      refreshToken: session.refreshToken,
    }),
  });
  assert.equal(refreshResponse.status, 200);
  const refreshedSession = (await refreshResponse.json()) as { accessToken: string };

  const persistedSettingsResponse = await app.request("http://localhost/settings", {
    headers: { authorization: `Bearer ${refreshedSession.accessToken}` },
  });
  assert.equal(persistedSettingsResponse.status, 200);
  const persistedSettingsPayload = (await persistedSettingsResponse.json()) as {
    privacyOptions: { profileVisibility: string; analyticsEnabled: boolean };
    effectivePolicy: {
      notification: { eligibleChannels: string[]; presetKey?: string };
      device: { uploadChunkSizeBytes: number };
      developer: { environment: string; policySourceSummary?: string };
    };
  };
  assert.equal(persistedSettingsPayload.privacyOptions.profileVisibility, "public");
  assert.equal(persistedSettingsPayload.privacyOptions.analyticsEnabled, false);
  assert.deepEqual(persistedSettingsPayload.effectivePolicy.notification.eligibleChannels, []);
  assert.equal(persistedSettingsPayload.effectivePolicy.notification.presetKey, "paused");
  assert.equal(persistedSettingsPayload.effectivePolicy.device.uploadChunkSizeBytes, 8192);
  assert.equal(persistedSettingsPayload.effectivePolicy.developer.environment, "debug");
  assert.match(persistedSettingsPayload.effectivePolicy.developer.policySourceSummary ?? "", /debug-environment preferences/i);
});

test("settings debug controls are locked in production bindings", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "wechat");
  const productionBindings = {
    MINIX_DEPLOY_ENV: "production",
  } as never;

  const settingsResponse = await app.request(
    "http://localhost/settings",
    {
      headers: { authorization: `Bearer ${session.accessToken}` },
    },
    productionBindings,
  );
  assert.equal(settingsResponse.status, 200);
  const settingsPayload = (await settingsResponse.json()) as {
    preferences: { developerOptions: { logsEnabled: boolean; experimentsEnabled: boolean } };
    featureToggles: { experimentsEnabled: boolean };
    effectivePolicy: {
      developer: {
        environment: string;
        logsEditable: boolean;
        experimentsEditable: boolean;
        lockedReason?: string;
        policySourceSummary?: string;
        exposureSummary?: string;
      };
      notification: { presetKey?: string };
    };
    notificationPresets?: Array<{ presetKey: string; active: boolean }>;
    lockedSettingKeys: string[];
  };
  assert.equal(settingsPayload.preferences.developerOptions.logsEnabled, false);
  assert.equal(settingsPayload.preferences.developerOptions.experimentsEnabled, false);
  assert.equal(settingsPayload.featureToggles.experimentsEnabled, false);
  assert.equal(settingsPayload.effectivePolicy.developer.environment, "production");
  assert.equal(settingsPayload.effectivePolicy.developer.logsEditable, false);
  assert.equal(settingsPayload.effectivePolicy.developer.experimentsEditable, false);
  assert.equal(settingsPayload.effectivePolicy.developer.lockedReason, "Developer diagnostics are locked in production.");
  assert.equal(settingsPayload.effectivePolicy.notification.presetKey, "balanced");
  assert.equal(settingsPayload.effectivePolicy.developer.policySourceSummary, "Developer controls are locked by environment policy.");
  assert.match(settingsPayload.effectivePolicy.developer.exposureSummary ?? "", /Production hides editable diagnostics/i);
  assert.equal(settingsPayload.notificationPresets?.some((preset) => preset.presetKey === "balanced" && preset.active), true);
  assert.deepEqual(settingsPayload.lockedSettingKeys, [
    "preferences.developerOptions.logsEnabled",
    "preferences.developerOptions.experimentsEnabled",
    "featureToggles.experimentsEnabled",
  ]);

  const updateResponse = await app.request(
    "http://localhost/settings",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${session.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        preferences: {
          developerOptions: {
            logsEnabled: true,
            experimentsEnabled: true,
          },
        },
      }),
    },
    productionBindings,
  );
  assert.equal(updateResponse.status, 200);
  const updatedPayload = (await updateResponse.json()) as {
    preferences: { developerOptions: { logsEnabled: boolean; experimentsEnabled: boolean } };
    featureToggles: { experimentsEnabled: boolean };
    effectivePolicy: { developer: { logsEnabled: boolean; experimentsEnabled: boolean; policySourceSummary?: string } };
  };
  assert.equal(updatedPayload.preferences.developerOptions.logsEnabled, false);
  assert.equal(updatedPayload.preferences.developerOptions.experimentsEnabled, false);
  assert.equal(updatedPayload.featureToggles.experimentsEnabled, false);
  assert.equal(updatedPayload.effectivePolicy.developer.logsEnabled, false);
  assert.equal(updatedPayload.effectivePolicy.developer.experimentsEnabled, false);
  assert.equal(updatedPayload.effectivePolicy.developer.policySourceSummary, "Developer controls are locked by environment policy.");
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

  const accountSecurityCode = await requestPhoneCode(app, "13800000001", "account_security", session.accessToken);
  const phoneVerificationCode = await requestPhoneCode(app, "13800000022", "change_phone");
  const phoneResponse = await app.request("http://localhost/account/change-phone", {
    method: "POST",
    headers,
    body: JSON.stringify({
      phoneNumber: "13800000022",
      verificationCode: phoneVerificationCode,
      securityVerificationCode: accountSecurityCode,
      riskConfirmed: true,
    }),
  });
  assert.equal(phoneResponse.status, 200);
  const phonePayload = (await phoneResponse.json()) as {
    accountSummary: { phoneBound: boolean; phoneNumberMasked?: string };
    operationRecord?: { kind: string; status: string; verificationPurpose?: string };
    transitionMessage: string;
  };
  assert.equal(phonePayload.accountSummary.phoneBound, true);
  assert.equal(phonePayload.accountSummary.phoneNumberMasked, "138****0022");
  assert.equal(phonePayload.operationRecord?.kind, "change_phone");
  assert.equal(phonePayload.operationRecord?.status, "completed");
  assert.equal(phonePayload.operationRecord?.verificationPurpose, "change_phone");
  assert.equal(phonePayload.transitionMessage, "Phone binding updated.");

  const unbindSecurityCode = await requestPhoneCode(app, "13800000022", "account_security", session.accessToken);
  const unbindResponse = await app.request("http://localhost/account/unbind", {
    method: "POST",
    headers,
    body: JSON.stringify({
      provider: "wechat",
      verificationCode: unbindSecurityCode,
      riskConfirmed: true,
    }),
  });
  assert.equal(unbindResponse.status, 200);
  const unbindPayload = (await unbindResponse.json()) as {
    accountSummary: { wechatBound: boolean };
    operationRecord?: { kind: string; status: string; notificationHookLabel?: string };
  };
  assert.equal(unbindPayload.accountSummary.wechatBound, false);
  assert.equal(unbindPayload.operationRecord?.kind, "unbind_wechat");
  assert.equal(unbindPayload.operationRecord?.status, "completed");
  assert.equal(unbindPayload.operationRecord?.notificationHookLabel, "notify:wechat_unbound");

  const followingListResponse = await app.request(
    "http://localhost/account/relations/list?kind=following&page=1&pageSize=1&keyword=Practice",
    {
      headers: { authorization: `Bearer ${session.accessToken}` },
    },
  );
  assert.equal(followingListResponse.status, 200);
  const followingListPayload = (await followingListResponse.json()) as {
    relationList: {
      kind: string;
      items: Array<{ targetUserId: string; friendState?: string }>;
      pagination: { page: number; pageSize: number; hasMore: boolean; total?: number };
      summaryLabel?: string;
      availableKinds?: string[];
    };
  };
  assert.equal(followingListPayload.relationList.kind, "following");
  assert.equal(followingListPayload.relationList.items.length, 1);
  assert.equal(followingListPayload.relationList.items[0]?.targetUserId, "practice_buddy");
  assert.equal(followingListPayload.relationList.items[0]?.friendState, "outgoing_request");
  assert.equal(followingListPayload.relationList.pagination.page, 1);
  assert.equal(followingListPayload.relationList.pagination.pageSize, 1);
  assert.match(followingListPayload.relationList.summaryLabel ?? "", /shared account workspace/i);
  assert.equal(followingListPayload.relationList.availableKinds?.includes("friends"), true);

  const relationResponse = await app.request("http://localhost/account/relations", {
    method: "POST",
    headers,
    body: JSON.stringify({
      targetUserId: "practice_buddy",
      action: "set_remark",
      remarkName: "Trusted mentor",
      listKind: "following",
      page: 1,
      pageSize: 10,
    }),
  });
  assert.equal(relationResponse.status, 200);
  const relationPayload = (await relationResponse.json()) as {
    relationTargets: Array<{ targetUserId: string; remarkName?: string }>;
    relationList?: { items: Array<{ targetUserId: string; remarkName?: string }> };
    transitionMessage: string;
  };
  assert.equal(relationPayload.relationTargets.some((item) => item.targetUserId === "practice_buddy"), true);
  assert.equal(
    relationPayload.relationList?.items.find((item) => item.targetUserId === "practice_buddy")?.remarkName,
    "Trusted mentor",
  );
  assert.equal(relationPayload.transitionMessage, "Remark name updated.");

  const cancellationSecurityCode = await requestPhoneCode(app, "13800000022", "account_security", session.accessToken);
  const cancellationResponse = await app.request("http://localhost/account/cancellation", {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: "request",
      confirm: true,
      verificationCode: cancellationSecurityCode,
      riskConfirmed: true,
      reason: "privacy",
    }),
  });
  assert.equal(cancellationResponse.status, 200);
  const cancellationPayload = (await cancellationResponse.json()) as {
    userStatus: { availability: string; cancellationInProgress: boolean; cancellationRevocableUntil?: string };
    accountOperations: Array<{ kind: string; available: boolean }>;
    operationRecord?: { kind: string; status: string; notificationHookLabel?: string };
    transitionMessage: string;
  };
  assert.equal(cancellationPayload.userStatus.availability, "cancellation_pending");
  assert.equal(cancellationPayload.userStatus.cancellationInProgress, true);
  assert.equal(typeof cancellationPayload.userStatus.cancellationRevocableUntil, "string");
  assert.equal(
    cancellationPayload.accountOperations.find((item) => item.kind === "request_cancellation")?.available,
    false,
  );
  assert.equal(
    cancellationPayload.accountOperations.find((item) => item.kind === "revoke_cancellation")?.available,
    true,
  );
  assert.equal(cancellationPayload.operationRecord?.kind, "request_cancellation");
  assert.equal(cancellationPayload.operationRecord?.status, "pending");
  assert.equal(cancellationPayload.operationRecord?.notificationHookLabel, "notify:cancellation_requested");
  assert.equal(cancellationPayload.transitionMessage, "Cancellation request submitted.");

  const revokeResponse = await app.request("http://localhost/account/cancellation", {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: "revoke",
      confirm: true,
    }),
  });
  assert.equal(revokeResponse.status, 200);
  const revokePayload = (await revokeResponse.json()) as {
    userStatus: { availability: string; cancellationInProgress: boolean };
    accountOperations: Array<{ kind: string; available: boolean }>;
    operationRecord?: { kind: string; status: string; notificationHookLabel?: string };
    transitionMessage: string;
  };
  assert.equal(revokePayload.userStatus.availability, "enabled");
  assert.equal(revokePayload.userStatus.cancellationInProgress, false);
  assert.equal(revokePayload.accountOperations.find((item) => item.kind === "request_cancellation")?.available, true);
  assert.equal(revokePayload.accountOperations.find((item) => item.kind === "revoke_cancellation")?.available, false);
  assert.equal(revokePayload.operationRecord?.kind, "revoke_cancellation");
  assert.equal(revokePayload.operationRecord?.status, "revoked");
  assert.equal(revokePayload.operationRecord?.notificationHookLabel, "notify:cancellation_revoked");
  assert.equal(revokePayload.transitionMessage, "Cancellation request revoked.");

  const settingsResponse = await app.request("http://localhost/settings", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(settingsResponse.status, 200);
  const settingsPayload = (await settingsResponse.json()) as {
    preferences: { account: { phoneEntryLabel: string; cancellationEntryLabel: string } };
  };
  assert.equal(settingsPayload.preferences.account.phoneEntryLabel, "Change phone");
  assert.equal(settingsPayload.preferences.account.cancellationEntryLabel, "Cancellation entry");
});

test("content cms endpoints support draft save, review queue, lifecycle audit, and reader access rules", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "wechat");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };

  const coverUpload = await uploadContentAsset(app, session.accessToken, {
    taskId: "content_cover_upload",
    assetId: "content_cover_asset",
    fileName: "content-cover.png",
  });
  const attachmentUpload = await uploadContentAsset(app, session.accessToken, {
    taskId: "content_attachment_upload",
    assetId: "content_attachment_asset",
    fileName: "content-attachment.png",
  });

  const detailResponse = await app.request("http://localhost/content/detail?contentId=lesson_2", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(detailResponse.status, 200);
  const detailPayload = (await detailResponse.json()) as {
    contentDetail: { lifecycle: { state: string }; permissions?: { actorRole: string } };
    contentAccess: { visibility: string; accessible: boolean };
  };
  assert.equal(detailPayload.contentDetail.lifecycle.state, "draft");
  assert.equal(detailPayload.contentAccess.visibility, "login_required");
  assert.equal(detailPayload.contentAccess.accessible, false);
  assert.equal(detailPayload.contentDetail.permissions?.actorRole, "reader");

  const saveDraftResponse = await app.request("http://localhost/content/save-draft", {
    method: "POST",
    headers,
    body: JSON.stringify({
      contentId: "lesson_2",
      model: "course",
      title: "Dialogue Studio",
      subtitle: "Saved from CMS",
      summary: "Draft summary refreshed from the CMS authoring flow.",
      bodyPreview: "Draft body preview refreshed from the CMS authoring flow.",
      visibility: "login_required",
      categoryKey: "input",
      categoryLabel: "Input",
      tags: [{ key: "course", label: "Course" }, { key: "draft", label: "Draft" }],
      coverAssetId: coverUpload.uploadAsset?.assetId,
      attachmentAssetIds: [attachmentUpload.uploadAsset?.assetId],
      actorRole: "author",
    }),
  });
  assert.equal(saveDraftResponse.status, 200);
  const savedDraftPayload = (await saveDraftResponse.json()) as {
    contentCard: { title: string; coverUrl?: string; lifecycle: { state: string; moderationSummary?: string }; attachmentSummary?: string };
    contentDetail: {
      attachments?: Array<{ assetId: string; url?: string; assetSummary?: string; derivedAssetSummary?: string }>;
      moderationSummary?: string;
      attachmentSummary?: string;
      auditHistory?: Array<{ action: string }>;
      permissions?: { canSaveDraft: boolean; canManageAttachments: boolean };
    };
    transitionMessage: string;
  };
  assert.equal(savedDraftPayload.contentCard.title, "Dialogue Studio");
  assert.equal(savedDraftPayload.contentCard.lifecycle.state, "draft");
  assert.equal(savedDraftPayload.contentCard.coverUrl, coverUpload.uploadAsset?.url);
  assert.equal(savedDraftPayload.contentDetail.attachments?.[0]?.assetId, attachmentUpload.uploadAsset?.assetId);
  assert.equal(savedDraftPayload.contentCard.lifecycle.moderationSummary?.includes("draft"), true);
  assert.equal(savedDraftPayload.contentDetail.moderationSummary?.includes("draft"), true);
  assert.equal(savedDraftPayload.contentDetail.attachmentSummary?.includes("attachment reference"), true);
  assert.equal(Boolean(savedDraftPayload.contentDetail.attachments?.[0]?.assetSummary), true);
  assert.equal(Boolean(savedDraftPayload.contentDetail.attachments?.[0]?.derivedAssetSummary), true);
  assert.equal(savedDraftPayload.contentDetail.permissions?.canSaveDraft, true);
  assert.equal(savedDraftPayload.contentDetail.permissions?.canManageAttachments, true);
  assert.equal(savedDraftPayload.contentDetail.auditHistory?.at(-1)?.action, "save_draft");
  assert.equal(savedDraftPayload.transitionMessage, "Content draft saved.");

  const submitReviewResponse = await app.request("http://localhost/content/lifecycle", {
    method: "POST",
    headers,
    body: JSON.stringify({
      contentId: "lesson_2",
      action: "submit_review",
      reviewMessage: "Ready for reviewer approval.",
      actorRole: "author",
    }),
  });
  assert.equal(submitReviewResponse.status, 200);
  const submittedPayload = (await submitReviewResponse.json()) as {
    contentCard: { lifecycle: { state: string } };
    contentDetail: { reviewRecord?: { status: string; reviewerLabel?: string; moderationSummary?: string }; moderationSummary?: string };
    transitionMessage: string;
  };
  assert.equal(submittedPayload.contentCard.lifecycle.state, "under_review");
  assert.equal(submittedPayload.contentDetail.reviewRecord?.status, "queued");
  assert.equal(submittedPayload.contentDetail.reviewRecord?.reviewerLabel, "Reviewer Mina");
  assert.equal(submittedPayload.contentDetail.reviewRecord?.moderationSummary?.includes("queued"), true);
  assert.equal(submittedPayload.contentDetail.moderationSummary?.includes("queued"), true);
  assert.equal(submittedPayload.transitionMessage, "Content submitted for review.");

  const reviewQueueResponse = await app.request("http://localhost/content/review-queue?actorRole=reviewer", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(reviewQueueResponse.status, 200);
  const reviewQueuePayload = (await reviewQueueResponse.json()) as {
    reviewQueue: { items: Array<{ contentId: string; attachmentsCount: number; reviewerLabel?: string; moderationSummary?: string }> };
  };
  assert.equal(reviewQueuePayload.reviewQueue.items.some((item) => item.contentId === "lesson_2"), true);
  assert.equal(reviewQueuePayload.reviewQueue.items.find((item) => item.contentId === "lesson_2")?.attachmentsCount, 1);
  assert.equal(reviewQueuePayload.reviewQueue.items.find((item) => item.contentId === "lesson_2")?.reviewerLabel, "Reviewer Mina");
  assert.equal(reviewQueuePayload.reviewQueue.items.find((item) => item.contentId === "lesson_2")?.moderationSummary?.includes("queued"), true);

  const forbiddenApproveResponse = await app.request("http://localhost/content/lifecycle", {
    method: "POST",
    headers,
    body: JSON.stringify({
      contentId: "lesson_2",
      action: "approve_review",
      actorRole: "author",
    }),
  });
  assert.equal(forbiddenApproveResponse.status, 403);

  const approveResponse = await app.request("http://localhost/content/lifecycle", {
    method: "POST",
    headers,
    body: JSON.stringify({
      contentId: "lesson_2",
      action: "approve_review",
      actorRole: "reviewer",
      reviewMessage: "Approved for publication.",
    }),
  });
  assert.equal(approveResponse.status, 200);
  const approvePayload = (await approveResponse.json()) as {
    contentCard: { lifecycle: { state: string; moderationSummary?: string } };
    contentDetail: { auditHistory?: Array<{ action: string }>; reviewRecord?: { status: string; moderationSummary?: string }; moderationSummary?: string };
    transitionMessage: string;
  };
  assert.equal(approvePayload.contentCard.lifecycle.state, "published");
  assert.equal(approvePayload.contentDetail.reviewRecord?.status, "approved");
  assert.equal(approvePayload.contentCard.lifecycle.moderationSummary?.includes("approved"), true);
  assert.equal(approvePayload.contentDetail.reviewRecord?.moderationSummary?.includes("approved"), true);
  assert.equal(approvePayload.contentDetail.auditHistory?.at(-1)?.action, "approve_review");
  assert.equal(approvePayload.transitionMessage, "Content review approved.");

  const visibilityResponse = await app.request("http://localhost/content/lifecycle", {
    method: "POST",
    headers,
    body: JSON.stringify({
      contentId: "lesson_2",
      action: "change_visibility",
      visibility: "member_only",
      actorRole: "author",
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

  const readerDetailResponse = await app.request("http://localhost/content/detail?contentId=lesson_2&actorRole=reader", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(readerDetailResponse.status, 200);
  const readerDetailPayload = (await readerDetailResponse.json()) as {
    contentAccess: { accessible: boolean; requiresMembership: boolean };
    contentDetail: { permissions?: { actorRole: string }; auditHistory?: Array<unknown> };
  };
  assert.equal(readerDetailPayload.contentAccess.accessible, false);
  assert.equal(readerDetailPayload.contentAccess.requiresMembership, true);
  assert.equal(readerDetailPayload.contentDetail.permissions?.actorRole, "reader");
  assert.equal(readerDetailPayload.contentDetail.auditHistory, undefined);

  const archiveResponse = await app.request("http://localhost/content/lifecycle", {
    method: "POST",
    headers,
    body: JSON.stringify({
      contentId: "lesson_2",
      action: "archive",
      actorRole: "reviewer",
    }),
  });
  assert.equal(archiveResponse.status, 200);
  const archivePayload = (await archiveResponse.json()) as {
    contentCard: { lifecycle: { state: string } };
    transitionMessage: string;
  };
  assert.equal(archivePayload.contentCard.lifecycle.state, "offline");
  assert.equal(archivePayload.transitionMessage, "Content archived.");

  const restoreResponse = await app.request("http://localhost/content/lifecycle", {
    method: "POST",
    headers,
    body: JSON.stringify({
      contentId: "lesson_2",
      action: "restore",
      actorRole: "reviewer",
    }),
  });
  assert.equal(restoreResponse.status, 200);
  const restorePayload = (await restoreResponse.json()) as {
    contentCard: { lifecycle: { state: string } };
    transitionMessage: string;
  };
  assert.equal(restorePayload.contentCard.lifecycle.state, "published");
  assert.equal(restorePayload.transitionMessage, "Content restored.");

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
    items: Array<{ eyebrow?: string; title: string; routeTarget?: { routeId: string } }>;
    searchQuery: { mode: string; domain: string; sortKey?: string };
    searchResults: {
      activeDomain?: string;
      domainTabs?: Array<{ domain: string; total: number }>;
      ranking?: { appliedSortKey: string };
      grouping?: { strategy: string };
    };
    searchFilters: Array<{ key: string; selectedKeys: string[]; persistenceScope?: string }>;
  };
  assert.equal(userSearchPayload.searchQuery.mode, "user");
  assert.equal(userSearchPayload.searchQuery.domain, "user");
  assert.equal(userSearchPayload.items[0]?.eyebrow, "User");
  assert.equal(userSearchPayload.items[0]?.routeTarget?.routeId, "account.index");
  assert.equal(userSearchPayload.searchResults.activeDomain, "user");
  assert.deepEqual(userSearchPayload.searchFilters[0]?.selectedKeys, ["user"]);
  assert.equal(userSearchPayload.searchFilters[0]?.persistenceScope, "route");
  assert.equal(userSearchPayload.searchResults.domainTabs?.some((item) => item.domain === "user" && item.total >= 1), true);
  assert.equal(userSearchPayload.searchResults.ranking?.appliedSortKey, "recommended");
  assert.equal(userSearchPayload.searchResults.grouping?.strategy, "flat");

  const contentSearchResponse = await app.request("http://localhost/feed?mode=content&domain=all&sort=updatedAt", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(contentSearchResponse.status, 200);
  const contentSearchPayload = (await contentSearchResponse.json()) as {
    items: Array<{ id: string; eyebrow?: string; contentCard?: { lifecycle: { state: string } } }>;
    searchQuery: { mode: string; domain: string; sortKey?: string };
    searchResults: {
      resultGroups?: Array<{ domain: string; total: number }>;
      ranking?: { appliedSortKey: string };
      grouping?: { strategy: string };
    };
  };
  assert.equal(contentSearchPayload.searchQuery.mode, "content");
  assert.equal(contentSearchPayload.searchQuery.domain, "all");
  assert.equal(contentSearchPayload.searchQuery.sortKey, "updatedAt");
  assert.equal(Boolean(contentSearchPayload.items.some((item) => item.contentCard?.lifecycle.state)), true);
  assert.equal(contentSearchPayload.items[0]?.eyebrow, "Content");
  assert.equal(contentSearchPayload.items[1]?.eyebrow, "Novel");
  assert.equal(("routeTarget" in (contentSearchPayload.items[0] ?? {}) ? Boolean((contentSearchPayload.items[0] as { routeTarget?: unknown }).routeTarget) : false), false);
  assert.equal(
    (contentSearchPayload.items[1] as { routeTarget?: { routeId?: string; params?: { novelId?: string } } } | undefined)?.routeTarget?.routeId,
    "novel.detail",
  );
  assert.equal(
    (contentSearchPayload.items[1] as { routeTarget?: { routeId?: string; params?: { novelId?: string } } } | undefined)?.routeTarget?.params?.novelId,
    (contentSearchPayload.items[1] as { id: string } | undefined)?.id,
  );
  assert.equal(
    contentSearchPayload.searchResults.resultGroups?.some((group) => group.domain === "content" && group.total >= 1),
    true,
  );
  assert.equal(contentSearchPayload.searchResults.ranking?.appliedSortKey, "updatedAt");
  assert.equal(contentSearchPayload.searchResults.grouping?.strategy, "interleaved");

  const typoRecoveryResponse = await app.request("http://localhost/feed?keyword=travle&sort=updatedAt", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(typoRecoveryResponse.status, 200);
  const typoRecoveryPayload = (await typoRecoveryResponse.json()) as {
    items: Array<unknown>;
    searchQuery: { sortKey?: string };
    searchResults: {
      correctionKeyword?: string;
      recoverySuggestions?: Array<{ keyword: string }>;
      ranking?: { appliedSortKey: string };
      zeroResultGuidance?: { state: string; suggestedKeyword?: string };
    };
  };
  assert.equal(typoRecoveryPayload.items.length, 0);
  assert.equal(typoRecoveryPayload.searchQuery.sortKey, "updatedAt");
  assert.equal(typoRecoveryPayload.searchResults.correctionKeyword, "travel");
  assert.equal(typoRecoveryPayload.searchResults.recoverySuggestions?.[0]?.keyword, "travel");
  assert.equal(typoRecoveryPayload.searchResults.ranking?.appliedSortKey, "updatedAt");
  assert.equal(typoRecoveryPayload.searchResults.zeroResultGuidance?.state, "corrected");
  assert.equal(typoRecoveryPayload.searchResults.zeroResultGuidance?.suggestedKeyword, "travel");
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
    faqCatalog?: Array<{ entryId: string }>;
    supportEntries?: Array<{ entryId: string }>;
    supportEntry?: { threadId?: string };
    serviceLoopSummary?: string;
    latestTicket?: { ticketId: string };
    ticketList?: { items: Array<{ ticketId: string }> };
  };
  assert.equal(bootstrapPayload.feedbackCategories.length > 0, true);
  assert.equal(bootstrapPayload.feedbackCategories.some((category) => category.key === "product_issue"), true);
  assert.equal(bootstrapPayload.recommendedFaqEntries?.[0]?.entryId, "faq_account_recovery");
  assert.equal(bootstrapPayload.faqCatalog?.[0]?.entryId, "faq_account_recovery");
  assert.equal(bootstrapPayload.supportEntries?.[0]?.entryId?.startsWith("support_"), true);
  assert.equal(bootstrapPayload.supportEntry?.threadId, "thread_customer_service");
  assert.equal(typeof bootstrapPayload.serviceLoopSummary, "string");
  assert.equal(bootstrapPayload.latestTicket, undefined);
  assert.equal(bootstrapPayload.ticketList?.items.length ?? 0, 0);

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
        sourceContext: {
          pagePath: "/feedback",
          routeId: "feedback.form",
          label: "Feedback page",
        },
        actorContext: {
          userId: session.userId,
          platform: "h5",
          appVersion: "1.0.0",
          deviceSummary: "platform:h5 · version:1.0.0",
        },
        screenshotAssets: [],
        attachmentAssets: [],
      },
    }),
  });
  assert.equal(submitResponse.status, 200);
  const submitPayload = (await submitResponse.json()) as {
    feedbackTicket: {
      ticketId: string;
      title: string;
      revisitRequested: boolean;
      supportThreadId?: string;
      context: {
        sourcePage: string;
        sourceContext?: { pagePath?: string; routeId?: string; label?: string };
        actorContext?: { userId?: string; platform?: string };
      };
    };
    feedbackCategory: { key: string };
    feedbackStatus: {
      state: string;
      processingHistory: Array<{ actorLabel: string }>;
      supportLoopSummary?: string;
      operatorActionSummary?: string;
      sharedThreadSummary?: string;
      supportEntry?: { threadId?: string; queueKey?: string; threadSummary?: string; supportLoopSummary?: string };
      assignee?: { label: string };
      sla?: { label: string };
      revisitAction?: { enabled: boolean };
    };
  };
  assert.equal(submitPayload.feedbackCategory.key, "product_issue");
  assert.equal(submitPayload.feedbackTicket.title, "Inbox route feels stale after refresh");
  assert.equal(submitPayload.feedbackTicket.revisitRequested, true);
  assert.equal(submitPayload.feedbackTicket.context.sourcePage, "/feedback");
  assert.equal(submitPayload.feedbackTicket.context.sourceContext?.routeId, "feedback.form");
  assert.equal(submitPayload.feedbackTicket.context.actorContext?.userId, session.userId);
  assert.equal(submitPayload.feedbackStatus.processingHistory.length > 0, true);
  assert.equal(typeof submitPayload.feedbackStatus.supportEntry?.threadId, "string");
  assert.equal(submitPayload.feedbackStatus.supportEntry?.threadId === "thread_customer_service", false);
  assert.equal(submitPayload.feedbackTicket.supportThreadId, submitPayload.feedbackStatus.supportEntry?.threadId);
  assert.equal(submitPayload.feedbackStatus.supportEntry?.queueKey, "product_support");
  assert.equal(
    submitPayload.feedbackStatus.supportLoopSummary,
    "Product Support has not assigned an operator yet, but the shared support thread is already reserved for follow-up.",
  );
  assert.equal(
    submitPayload.feedbackStatus.sharedThreadSummary,
    `Product Support continues follow-up in thread ${submitPayload.feedbackStatus.supportEntry?.threadId} with Support Bot.`,
  );
  assert.equal(
    submitPayload.feedbackStatus.supportEntry?.threadSummary,
    `Product Support continues follow-up in thread ${submitPayload.feedbackStatus.supportEntry?.threadId} with Support Bot.`,
  );
  assert.equal(submitPayload.feedbackStatus.assignee?.label, "Support Bot");
  assert.equal(submitPayload.feedbackStatus.sla?.label, "24 hour response");
  assert.equal(submitPayload.feedbackStatus.revisitAction?.enabled, true);

  const supportThreadResponse = await app.request(
    `http://localhost/messages/threads?type=customer_service&sourceTicketId=${submitPayload.feedbackTicket.ticketId}`,
    { headers },
  );
  assert.equal(supportThreadResponse.status, 200);
  const supportThreadPayload = (await supportThreadResponse.json()) as {
    threadList: {
      items: Array<{
        supportProgress?: { ticketId?: string; supportLoopSummary?: string; operatorActionSummary?: string };
        sourceContext?: { routeId?: string };
        actorContext?: { userId?: string };
      }>;
    };
  };
  assert.equal(supportThreadPayload.threadList.items[0]?.supportProgress?.ticketId, submitPayload.feedbackTicket.ticketId);
  assert.equal(
    supportThreadPayload.threadList.items[0]?.supportProgress?.supportLoopSummary,
    "Product Support is now handling this case in the shared support thread.",
  );
  assert.equal(supportThreadPayload.threadList.items[0]?.sourceContext?.routeId, "feedback.form");
  assert.equal(supportThreadPayload.threadList.items[0]?.actorContext?.userId, session.userId);

  const ticketListResponse = await app.request("http://localhost/feedback/tickets?page=1&pageSize=10", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(ticketListResponse.status, 200);
  const ticketListPayload = (await ticketListResponse.json()) as {
    ticketList: {
      items: Array<{ ticketId: string; supportThreadId?: string; assignee?: { label: string } }>;
      selectedTicketId?: string;
    };
    faqCatalog: Array<{ entryId: string }>;
    supportEntries: Array<{ entryId: string }>;
  };
  assert.equal(ticketListPayload.ticketList.items[0]?.ticketId, submitPayload.feedbackTicket.ticketId);
  assert.equal(ticketListPayload.ticketList.items[0]?.supportThreadId, submitPayload.feedbackTicket.supportThreadId);
  assert.equal(ticketListPayload.ticketList.items[0]?.assignee?.label, "Support Bot");
  assert.equal(ticketListPayload.ticketList.selectedTicketId, submitPayload.feedbackTicket.ticketId);
  assert.equal(ticketListPayload.faqCatalog[0]?.entryId, "faq_account_recovery");
  assert.equal(ticketListPayload.supportEntries.length > 0, true);

  const operatorActionResponse = await app.request("http://localhost/feedback/ticket/action", {
    method: "POST",
    headers,
    body: JSON.stringify({
      ticketId: submitPayload.feedbackTicket.ticketId,
      state: "resolved",
      priority: "urgent",
      labels: ["product", "bug", "route-guard"],
      assignee: {
        userId: "support_agent_2",
        label: "Case Owner",
        teamLabel: "Product Support",
      },
      queueKey: "product_support",
      queueLabel: "Product Support",
      sla: {
        policyKey: "product_issue_default_sla",
        label: "4 hour response",
        deadlineAt: "2026-04-08T15:30:00.000Z",
        breached: false,
      },
      note: "Escalated after reproducing the stale unread badge.",
      supportReply: "We refreshed the route-level cache and confirmed the unread badge now matches the thread state.",
    }),
  });
  assert.equal(operatorActionResponse.status, 200);
  const operatorActionPayload = (await operatorActionResponse.json()) as {
    feedbackTicket: { priority: string; labels: string[]; supportThreadId?: string };
    feedbackStatus: {
      state: string;
      assignee?: { label: string };
      processingHistory: Array<{ actorLabel: string; note?: string }>;
    };
    ticketList: { items: Array<{ priority: string }> };
  };
  assert.equal(operatorActionPayload.feedbackStatus.state, "resolved");
  assert.equal(operatorActionPayload.feedbackStatus.assignee?.label, "Case Owner");
  assert.equal(operatorActionPayload.feedbackTicket.priority, "urgent");
  assert.equal(operatorActionPayload.feedbackTicket.labels.includes("route-guard"), true);
  assert.equal(operatorActionPayload.ticketList.items[0]?.priority, "urgent");
  assert.equal(
    operatorActionPayload.feedbackStatus.processingHistory.some(
      (record) =>
        record.actorLabel === "Case Owner" &&
        record.note === "Escalated after reproducing the stale unread badge.",
    ),
    true,
  );

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
  assert.equal(revisitPayload.feedbackStatus.state, "triaged");
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
    feedbackTicket: { ticketId: string; supportThreadId?: string };
    feedbackStatus: { state: string };
  };
  assert.equal(ticketPayload.feedbackTicket.ticketId, submitPayload.feedbackTicket.ticketId);
  assert.equal(ticketPayload.feedbackTicket.supportThreadId, submitPayload.feedbackTicket.supportThreadId);
  assert.equal(ticketPayload.feedbackStatus.state, revisitPayload.feedbackStatus.state);

  const messageThreadResponse = await app.request(
    `http://localhost/messages/thread?threadId=${submitPayload.feedbackTicket.supportThreadId}`,
    {
      headers: { authorization: `Bearer ${session.accessToken}` },
    },
  );
  assert.equal(messageThreadResponse.status, 200);
  const messageThreadPayload = (await messageThreadResponse.json()) as {
    messageThread: { supportProgress?: { ticketId?: string } };
    messageItems: Array<{ body: string; senderRole: string }>;
  };
  assert.equal(messageThreadPayload.messageThread.supportProgress?.ticketId, submitPayload.feedbackTicket.ticketId);
  assert.equal(
    messageThreadPayload.messageItems.some(
      (item) =>
        item.senderRole === "support" &&
        item.body ===
          "We refreshed the route-level cache and confirmed the unread badge now matches the thread state.",
    ),
    true,
  );

  const refreshedBootstrapResponse = await app.request("http://localhost/feedback/bootstrap", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(refreshedBootstrapResponse.status, 200);
  const refreshedBootstrapPayload = (await refreshedBootstrapResponse.json()) as {
    latestTicket?: { ticketId: string };
    latestCategory?: { key: string };
    ticketList?: { items: Array<{ ticketId: string }> };
  };
  assert.equal(refreshedBootstrapPayload.latestTicket?.ticketId, submitPayload.feedbackTicket.ticketId);
  assert.equal(refreshedBootstrapPayload.latestCategory?.key, "product_issue");
  assert.equal(refreshedBootstrapPayload.ticketList?.items[0]?.ticketId, submitPayload.feedbackTicket.ticketId);
});

test("feedback rate limiting updates the security center with feedback-scope audit state", async () => {
  const store = createMemoryApiStore();
  const app = createApiApp({
    store,
    authRateLimitConfig: {
      windowSeconds: 60,
      loginMaxAttempts: 10,
      refreshMaxAttempts: 10,
      feedbackMaxAttempts: 1,
    },
    authRateLimitStore: createMemoryRateLimitCounterStore(),
  });
  const session = await login(app, "h5");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
    "x-forwarded-for": "203.0.113.40, 10.0.0.2",
  };
  const feedbackBody = {
    type: "issue_report",
    categoryKey: "product_issue",
    title: "Feedback rate limit audit",
    description: "Exercise the feedback rate limiter.",
    context: {
      sourcePage: "/feedback",
      platform: "h5",
      appVersion: "1.0.0",
      screenshotAssets: [],
      attachmentAssets: [],
    },
  };

  const firstResponse = await app.request("http://localhost/feedback", {
    method: "POST",
    headers,
    body: JSON.stringify(feedbackBody),
  });
  assert.equal(firstResponse.status, 200);

  const secondResponse = await app.request("http://localhost/feedback", {
    method: "POST",
    headers,
    body: JSON.stringify(feedbackBody),
  });
  assert.equal(secondResponse.status, 429);
  const secondPayload = (await secondResponse.json()) as {
    code: string;
    rateLimitState?: { scope: string; limited: boolean };
  };
  assert.equal(secondPayload.code, "RATE_LIMITED");
  assert.equal(secondPayload.rateLimitState?.scope, "feedback");
  assert.equal(secondPayload.rateLimitState?.limited, true);

  const meResponse = await app.request("http://localhost/me", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(meResponse.status, 200);
  const mePayload = (await meResponse.json()) as {
    securityCenter: {
      latestRateLimit?: { scope: string; limited: boolean };
      auditEvents: Array<{ scope: string; action: string; result: string }>;
    };
  };
  assert.equal(mePayload.securityCenter.latestRateLimit?.scope, "feedback");
  assert.equal(mePayload.securityCenter.latestRateLimit?.limited, true);
  assert.equal(
    mePayload.securityCenter.auditEvents.some(
      (event) => event.scope === "feedback" && event.action === "feedback_submit_rate_limited" && event.result === "blocked",
    ),
    true,
  );
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
      governance: { governanceSummary?: string };
      lifecycle: { backendBacked: boolean; canCancel: boolean; retentionSummary?: string };
      ownershipSummary?: string;
    };
    uploadAsset?: { assetId: string; url: string; derivedAssetSummary?: string; metadata?: { variants?: unknown[] } };
  };
  assert.equal(created.source, "backend_session");
  assert.equal(created.uploadTask.stage, "uploading");
  assert.equal(created.uploadTask.lifecycle.backendBacked, true);
  assert.equal(created.uploadTask.lifecycle.canCancel, true);
  assert.equal(created.uploadTask.chunkingReserved, false);
  assert.equal(created.uploadTask.governance.governanceSummary?.includes("Sensitive review remains enabled"), true);
  assert.equal(created.uploadTask.lifecycle.retentionSummary?.includes("Retention remains active until"), true);
  assert.equal(created.uploadTask.ownershipSummary, "Asset ownership is not yet bound to a business record.");
  assert.equal(created.session?.nextChunkIndex, 0);
  assert.equal(created.transfer?.chunks.length, 4);
  assert.equal(Boolean(created.uploadAsset?.assetId), true);
  assert.equal(created.uploadAsset?.derivedAssetSummary?.includes("derived asset variant"), true);
  assert.equal((created.uploadAsset?.metadata?.variants?.length ?? 0) >= 1, true);

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
    uploadTask: { stage: string; reviewStatus: string; lifecycle: { canCancel: boolean; cleanupSummary?: string } };
    uploadAsset?: { assetId: string; derivedAssetSummary?: string; metadata?: { checksum?: string; reviewAnnotations?: string[] } };
    reviewRecord?: { annotationSummary?: string };
  };
  assert.equal(completed.source, "backend_complete");
  assert.equal(completed.uploadTask.stage, "reviewing");
  assert.equal(completed.uploadTask.reviewStatus, "pending");
  assert.equal(completed.uploadTask.lifecycle.canCancel, true);
  assert.equal(completed.reviewRecord?.annotationSummary?.includes("Review status: pending."), true);
  assert.equal(completed.uploadTask.lifecycle.cleanupSummary?.includes("Cleanup is not scheduled"), true);
  assert.equal(completed.uploadAsset?.metadata?.checksum, created.transfer?.fileChecksum);
  assert.equal(completed.uploadAsset?.derivedAssetSummary?.includes("derived asset variant"), true);
  assert.equal(completed.uploadAsset?.metadata?.reviewAnnotations?.includes("Review status: pending."), true);

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
    uploadTask?: { ownershipSummary?: string };
    references?: Array<{ ownerType: string; ownerId: string; role: string; ownerSummary?: string }>;
  };
  assert.equal(attached.source, "backend_attach");
  assert.equal(attached.references?.[0]?.ownerType, "content");
  assert.equal(attached.references?.[0]?.ownerId, "lesson_1");
  assert.equal(attached.references?.[0]?.ownerSummary?.includes("lesson_1"), true);
  assert.equal(attached.uploadTask?.ownershipSummary?.includes("lesson_1"), true);

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
    uploadTask: { stage: string; lifecycle: { canRetry: boolean; retentionStatus: string; retentionSummary?: string } };
    uploadError?: { code: string };
    cleanupRecord?: { cleanupSummary?: string };
  };
  assert.equal(cancelled.source, "backend_cancel");
  assert.equal(cancelled.uploadTask.stage, "canceled");
  assert.equal(cancelled.uploadTask.lifecycle.canRetry, true);
  assert.equal(cancelled.uploadTask.lifecycle.retentionStatus, "scheduled_cleanup");
  assert.equal(cancelled.uploadTask.lifecycle.retentionSummary?.includes("scheduled for cleanup"), true);
  assert.equal(cancelled.cleanupRecord?.cleanupSummary?.includes("user_cancelled"), true);
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

test("upload endpoints expose production storage and review posture through env-backed metadata", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "h5");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };
  const uploadEnv = {
    MINIX_UPLOAD_PROVIDER_MODE: "production",
    MINIX_UPLOAD_STORAGE_PROVIDER: "cloudflare-r2",
    MINIX_UPLOAD_REVIEW_PROVIDER: "tencent-content-review",
    MINIX_UPLOAD_ASSET_BASE_URL: "https://assets.example.test",
  } as never;

  const sessionResponse = await app.request(
    "http://localhost/uploads/session",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        scenario: "content",
        selection: {
          uploadTask: {
            taskId: "upload_selection_production",
            scenario: "content",
            fileType: "image",
            stage: "completed",
            fileName: "production-screenshot.png",
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
            assetId: "asset_selection_production",
            fileType: "image",
            fileName: "production-screenshot.png",
            url: "https://example.test/local/production-screenshot.png",
            coverImageUrl: "https://example.test/local/production-cover.png",
            metadata: {
              sizeBytes: 245760,
              width: 1440,
              height: 900,
            },
          },
        },
      }),
    },
    uploadEnv,
  );
  assert.equal(sessionResponse.status, 200);
  const created = (await sessionResponse.json()) as {
    session?: { sessionId: string };
    transfer?: { fileChecksum: string; checksumAlgorithm: "sha256"; chunks: Array<unknown> };
    uploadAsset?: { url: string; thumbnailUrl?: string; coverImageUrl?: string; metadata?: { variants?: unknown[] } };
    reviewRecord?: { provider: string; providerMode?: string; storageProvider?: string; annotationSummary?: string };
    providerPosture?: {
      providerMode: string;
      storageProvider: string;
      reviewProvider: string;
      assetHost?: string;
      secretMaterialTracked: boolean;
      postureSummary: string;
    };
    uploadTask: { taskId: string; governance: { governanceSummary?: string } };
  };
  assert.equal(created.reviewRecord?.provider, "tencent-content-review");
  assert.equal(created.reviewRecord?.providerMode, "production");
  assert.equal(created.reviewRecord?.storageProvider, "cloudflare-r2");
  assert.equal(created.uploadTask.governance.governanceSummary?.includes("Sensitive review remains enabled"), true);
  assert.equal(created.uploadAsset?.url.startsWith("https://assets.example.test/uploads/assets/"), true);
  assert.equal(created.uploadAsset?.thumbnailUrl?.startsWith("https://assets.example.test/uploads/assets/"), true);
  assert.equal(created.uploadAsset?.coverImageUrl, "https://example.test/local/production-cover.png");
  assert.equal((created.uploadAsset?.metadata?.variants?.length ?? 0) >= 2, true);
  assert.equal(created.providerPosture?.providerMode, "production");
  assert.equal(created.providerPosture?.storageProvider, "cloudflare-r2");
  assert.equal(created.providerPosture?.reviewProvider, "tencent-content-review");
  assert.equal(created.providerPosture?.assetHost, "https://assets.example.test");
  assert.equal(created.providerPosture?.secretMaterialTracked, false);
  assert.equal(created.providerPosture?.postureSummary.includes("Secret material is not tracked in source"), true);

  for (const chunk of created.transfer?.chunks ?? []) {
    const chunkResponse = await app.request(
      "http://localhost/uploads/chunk",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          taskId: created.uploadTask.taskId,
          sessionId: created.session?.sessionId,
          chunk,
        }),
      },
      uploadEnv,
    );
    assert.equal(chunkResponse.status, 200);
  }

  const completeResponse = await app.request(
    "http://localhost/uploads/complete",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        taskId: created.uploadTask.taskId,
        sessionId: created.session?.sessionId,
        fileChecksum: created.transfer?.fileChecksum,
        checksumAlgorithm: created.transfer?.checksumAlgorithm,
      }),
    },
    uploadEnv,
  );
  assert.equal(completeResponse.status, 200);
  const completed = (await completeResponse.json()) as {
    uploadTask: { reviewMessage?: string };
    uploadAsset?: { metadata?: { reviewAnnotations?: string[] } };
    reviewRecord?: { provider: string; providerMode?: string; storageProvider?: string; message?: string; annotationSummary?: string };
    providerPosture?: { providerMode: string; storageProvider: string; reviewProvider: string };
  };
  assert.equal(completed.reviewRecord?.provider, "tencent-content-review");
  assert.equal(completed.reviewRecord?.providerMode, "production");
  assert.equal(completed.reviewRecord?.storageProvider, "cloudflare-r2");
  assert.equal(completed.providerPosture?.reviewProvider, "tencent-content-review");
  assert.equal(completed.reviewRecord?.annotationSummary?.includes("tencent-content-review"), true);
  assert.equal(completed.uploadAsset?.metadata?.reviewAnnotations?.includes("Provider: tencent-content-review."), true);
  assert.equal(
    completed.uploadTask.reviewMessage,
    "Sensitive review is pending through the configured upload review provider.",
  );
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
        sourceContext: {
          pagePath: "/workspace/media-tools",
          label: "Media Tools",
        },
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
        actorContext: {
          userId: session.userId,
          platform: "h5",
          appVersion: "1.0.0",
        },
        inviteBindingEnabled: true,
        returnFlowRecognized: false,
        shareCount: 0,
        clickCount: 0,
        returnCount: 0,
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
    landingTarget: { path?: string; shortLink?: string; shortCode?: string; authRedirect?: { path?: string; source?: string } };
    sharePayload: { shareToken?: string; shortLink?: string; sourceContext?: { pagePath?: string }; readinessSummary?: string };
    shareChannel: { readinessSummary?: string; fallbackSummary?: string };
    shareAttribution: { attributionId?: string; preparedAt?: string; actorContext?: { userId?: string }; replaySummary?: string };
    shortLinkRecord?: { shortCode?: string; resolvedCount?: number; readinessSummary?: string };
    attributionReport?: { shareAttribution?: { returnCount?: number } };
  };
  assert.equal(prepared.landingTarget.path, "/login");
  assert.equal(Boolean(prepared.landingTarget.shortLink), true);
  assert.equal(Boolean(prepared.landingTarget.shortCode), true);
  assert.equal(prepared.landingTarget.authRedirect?.path, "/workspace/media-tools");
  assert.equal(Boolean(prepared.sharePayload.shareToken), true);
  assert.equal(prepared.sharePayload.sourceContext?.pagePath, "/workspace/media-tools");
  assert.equal(prepared.sharePayload.readinessSummary?.includes("Short-link handoff is prepared"), true);
  assert.equal(prepared.shareChannel.readinessSummary?.includes("Short-link delivery is available"), true);
  assert.equal(prepared.shareChannel.fallbackSummary?.includes("Clipboard copy"), true);
  assert.equal(Boolean(prepared.shareAttribution.attributionId), true);
  assert.equal(Boolean(prepared.shareAttribution.preparedAt), true);
  assert.equal(prepared.shareAttribution.actorContext?.userId, session.userId);
  assert.equal(prepared.shareAttribution.replaySummary, "Short-link replay has not been resolved yet.");
  assert.equal(prepared.shortLinkRecord?.resolvedCount, 0);
  assert.equal(prepared.shortLinkRecord?.readinessSummary?.includes("sample-backed"), true);
  assert.equal(prepared.attributionReport?.shareAttribution?.returnCount, 0);

  const resolveResponse = await app.request(
    `http://localhost/share/resolve?shortCode=${prepared.landingTarget.shortCode ?? ""}`,
    {
      method: "GET",
      headers,
    },
  );
  assert.equal(resolveResponse.status, 200);

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
      returnCount: number;
      conversionCount: number;
      inviteBoundUserId?: string;
      lastLandingPath?: string;
      recognitionSummary?: string;
      inviteBindingSummary?: string;
    };
    shortLinkRecord?: { diagnosticsSummary?: string };
  };
  assert.equal(recognized.shareAttribution.returnFlowRecognized, true);
  assert.equal(recognized.shareAttribution.clickCount, 1);
  assert.equal(recognized.shareAttribution.returnCount, 1);
  assert.equal(recognized.shareAttribution.conversionCount, 1);
  assert.equal(recognized.shareAttribution.inviteBoundUserId, session.userId);
  assert.equal(recognized.shareAttribution.lastLandingPath, "/login");
  assert.equal(recognized.shareAttribution.recognitionSummary?.includes("1 returned"), true);
  assert.equal(recognized.shareAttribution.inviteBindingSummary?.includes(session.userId), true);
  assert.equal(recognized.shortLinkRecord?.diagnosticsSummary?.includes("resolved 1 time"), true);

  const reportResponse = await app.request(
    `http://localhost/share/report?attributionId=${prepared.shareAttribution.attributionId ?? ""}`,
    {
      method: "GET",
      headers,
    },
  );
  assert.equal(reportResponse.status, 200);
  const report = (await reportResponse.json()) as {
    attributionReport?: {
      shareAttribution?: { shareCount?: number; clickCount?: number; returnCount?: number; conversionCount?: number };
      shortLinkRecord?: { resolvedCount?: number };
    };
  };
  assert.equal(report.attributionReport?.shareAttribution?.shareCount, 1);
  assert.equal(report.attributionReport?.shareAttribution?.clickCount, 1);
  assert.equal(report.attributionReport?.shareAttribution?.returnCount, 1);
  assert.equal(report.attributionReport?.shareAttribution?.conversionCount, 1);
  assert.equal(report.attributionReport?.shortLinkRecord?.resolvedCount, 1);
});

test("share prepare can mint poster asset urls for poster channels", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "h5");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };

  const response = await app.request("http://localhost/share/prepare", {
    method: "POST",
    headers,
    body: JSON.stringify({
      sharePayload: {
        scenario: "poster",
        title: "Poster Invite",
        summary: "Poster share sample",
        landingPath: "/login",
        trackingParams: {
          channel: "host-h5",
          campaign: "poster",
        },
        inviteCode: "POSTER42",
      },
      shareChannel: {
        kind: "poster_image",
        label: "Poster",
        executable: true,
      },
      shareAttribution: {
        inviteBindingEnabled: true,
        returnFlowRecognized: false,
        shareCount: 0,
        clickCount: 0,
        returnCount: 0,
        conversionCount: 0,
      },
    }),
  });
  assert.equal(response.status, 200);
  const prepared = (await response.json()) as { posterAsset?: { url?: string }; sharePayload?: { posterImageUrl?: string } };
  assert.equal(Boolean(prepared.posterAsset?.url), true);
  assert.equal(prepared.sharePayload?.posterImageUrl, prepared.posterAsset?.url);
});

test("share endpoints expose production short-link and poster posture through env-backed metadata", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "h5");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };
  const shareEnv = {
    MINIX_SHARE_PROVIDER_MODE: "production",
    MINIX_SHARE_SHORT_LINK_PROVIDER: "branch-io",
    MINIX_SHARE_POSTER_PROVIDER: "canvas-render-service",
    MINIX_SHARE_SHORT_LINK_BASE_URL: "https://mini.example.test/s",
    MINIX_SHARE_POSTER_BASE_URL: "https://cdn.example.test/share-posters",
  };

  const response = await app.request(
    "http://localhost/share/prepare",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        sharePayload: {
          scenario: "poster",
          title: "Production Poster Invite",
          summary: "Production share sample",
          landingPath: "/login",
          trackingParams: {
            channel: "host-h5",
            campaign: "poster-production",
          },
          inviteCode: "PROD42",
        },
        shareChannel: {
          kind: "poster_image",
          label: "Poster",
          executable: true,
        },
        shareAttribution: {
          attributionId: "share12345678",
          inviteBindingEnabled: true,
          returnFlowRecognized: false,
          shareCount: 0,
          clickCount: 0,
          returnCount: 0,
          conversionCount: 0,
        },
      }),
    },
    shareEnv,
  );
  assert.equal(response.status, 200);
  const prepared = (await response.json()) as {
    sharePayload?: { shortLink?: string; posterImageUrl?: string; readinessSummary?: string };
    shareChannel?: { readinessSummary?: string };
    shortLinkRecord?: { shortLink?: string; provider?: string; providerMode?: string; readinessSummary?: string };
    posterAsset?: { url?: string; provider?: string; providerMode?: string; readinessSummary?: string; fallbackSummary?: string };
  };
  assert.equal(prepared.shortLinkRecord?.provider, "branch-io");
  assert.equal(prepared.shortLinkRecord?.providerMode, "production");
  assert.equal(prepared.shortLinkRecord?.shortLink, "https://mini.example.test/s/12345678");
  assert.equal(prepared.shortLinkRecord?.readinessSummary?.includes("backed by branch-io"), true);
  assert.equal(prepared.sharePayload?.shortLink, "https://mini.example.test/s/12345678");
  assert.equal(prepared.sharePayload?.readinessSummary?.includes("Poster delivery is prepared"), true);
  assert.equal(prepared.shareChannel?.readinessSummary?.includes("Provider-backed share infrastructure is configured"), true);
  assert.equal(prepared.posterAsset?.provider, "canvas-render-service");
  assert.equal(prepared.posterAsset?.providerMode, "production");
  assert.equal(prepared.posterAsset?.url, "https://cdn.example.test/share-posters/12345678.svg");
  assert.equal(prepared.posterAsset?.readinessSummary?.includes("canvas-render-service"), true);
  assert.equal(prepared.posterAsset?.fallbackSummary?.includes("save-image"), true);
  assert.equal(prepared.sharePayload?.posterImageUrl, prepared.posterAsset?.url);
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
    operationResult: { operation: string; applied: boolean; assetLedgerIds?: string[] };
  };
  assert.equal(cancelled.order.status, "cancelled");
  assert.equal(cancelled.paymentResult.status, "cancelled");
  assert.equal(cancelled.paymentResult.paid, false);
  assert.equal(cancelled.reconciliation.status, "reconciled");
  assert.equal(cancelled.operationResult.operation, "cancel");
  assert.equal(cancelled.operationResult.applied, true);
  assert.equal(cancelled.operationResult.assetLedgerIds?.length, 1);
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
    paymentResult: { status: string; paid: boolean; callbackVerified: boolean; continuitySummary?: string };
    callbackVerification: { status: string; callbackReference?: string; diagnosticsSummary?: string };
    operationResult?: { assetLedgerIds?: string[]; continuitySummary?: string };
  };
  assert.equal(confirmed.order.status, "paid");
  assert.equal(confirmed.paymentResult.status, "success");
  assert.equal(confirmed.paymentResult.paid, true);
  assert.equal(confirmed.paymentResult.callbackVerified, true);
  assert.equal(
    confirmed.paymentResult.continuitySummary,
    "The payment result is successful, but shared commerce continuity still depends on callback verification and reconciliation staying aligned.",
  );
  assert.equal(confirmed.callbackVerification.status, "verified");
  assert.equal(confirmed.callbackVerification.callbackReference, "cb_sample_success");
  assert.equal(
    confirmed.callbackVerification.diagnosticsSummary,
    "Callback verification completed and the shared order detail can now be trusted as the gateway source of truth.",
  );
  assert.equal(confirmed.operationResult?.assetLedgerIds?.length, 3);
  assert.equal(
    confirmed.operationResult?.continuitySummary,
    "Callback handling updated the shared order state, but reconciliation remains the follow-up continuity checkpoint.",
  );

  const reconcileResponse = await app.request("http://localhost/payments/reconcile", {
    method: "POST",
    headers,
    body: JSON.stringify({
      orderId: purchase.order.orderId,
    }),
  });
  assert.equal(reconcileResponse.status, 200);
  const reconciled = (await reconcileResponse.json()) as {
    reconciliation: { status: string; diagnosticsSummary?: string; ledgerAuditSummary?: string };
    operationResult: { operation: string; applied: boolean; continuitySummary?: string };
  };
  assert.equal(reconciled.reconciliation.status, "reconciled");
  assert.equal(
    reconciled.reconciliation.diagnosticsSummary,
    "Reconciliation confirmed that stored order state, payment result, and callback posture are aligned.",
  );
  assert.equal(
    reconciled.reconciliation.ledgerAuditSummary,
    "Reconciliation and operation ledgers keep the append-only audit trail for this order.",
  );
  assert.equal(reconciled.operationResult.operation, "reconcile");
  assert.equal(reconciled.operationResult.applied, true);
  assert.equal(
    reconciled.operationResult.continuitySummary,
    "Reconciliation updated the canonical order detail without creating a second payment surface.",
  );
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
    paymentResult: { message: string };
  };
  assert.equal(purchase.paymentIntent.gatewayReference?.providerMode, "production");
  assert.equal(purchase.paymentIntent.gatewayReference?.provider, "h5_gateway");
  assert.ok(purchase.paymentIntent.gatewayResponse?.paymentUrl);
  assert.ok(purchase.paymentIntent.gatewayResponse?.signature);
  assert.equal(purchase.paymentResult.message.includes("sample"), false);

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
    callbackVerification?: { message: string };
    paymentLedger?: Array<{ kind: string; status: string }>;
    operationLedger?: Array<{ kind: string }>;
    callbackLedger?: Array<{ verificationStatus: string; replayProtected: boolean }>;
  };
  assert.equal(signed.order.status, "paid");
  assert.equal(signed.paymentIntent.gatewayReference?.gatewayTransactionId, gatewayTransactionId);
  assert.equal(signed.callbackVerification?.message, "Production callback verification succeeded.");
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
    operationResult?: { assetLedgerIds?: string[] };
  };
  assert.equal(refunded.order.status, "refunded");
  assert.equal(refunded.paymentResult.status, "refunded");
  assert.equal(refunded.paymentResult.paid, false);
  assert.equal(refunded.entitlement?.active, false);
  assert.equal(refunded.entitlement?.statusLabel, "Refunded");
  assert.equal(refunded.operationResult?.assetLedgerIds?.length, 2);
});

test("generic sku purchase exposes catalog, order list, subscription lifecycle, and after-sales detail", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "h5");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };

  const catalogResponse = await app.request("http://localhost/orders/catalog", { headers });
  assert.equal(catalogResponse.status, 200);
  const catalog = (await catalogResponse.json()) as {
    products: Array<{ productType: string }>;
    skus: Array<{ skuId: string; productType: string }>;
  };
  assert.equal(catalog.products.some((product) => product.productType === "membership"), true);
  assert.equal(catalog.products.some((product) => product.productType === "subscription"), true);
  assert.equal(catalog.products.some((product) => product.productType === "one_time"), true);
  assert.equal(catalog.products.some((product) => product.productType === "value_added"), true);

  const purchaseResponse = await app.request("http://localhost/orders/purchase", {
    method: "POST",
    headers,
    body: JSON.stringify({
      skuId: "study_club_plus_monthly",
      source: "reader",
      novelId: "novel_lantern",
      chapterId: "lantern_ch_03",
    }),
  });
  assert.equal(purchaseResponse.status, 200);
  const purchase = (await purchaseResponse.json()) as {
    order: { orderId: string; productType: string };
    sku: { skuId: string };
    subscription?: { subscriptionId: string; status: string };
    entitlement?: { productType: string };
  };
  assert.equal(purchase.order.productType, "subscription");
  assert.equal(purchase.sku.skuId, "study_club_plus_monthly");
  assert.equal(purchase.subscription?.status, "active");
  assert.equal(purchase.entitlement?.productType, "subscription");

  const orderListResponse = await app.request("http://localhost/orders/list?page=1&pageSize=20&productType=subscription", {
    headers,
  });
  assert.equal(orderListResponse.status, 200);
  const orderList = (await orderListResponse.json()) as {
    orderList: { total: number; items: Array<{ orderId: string; skuId?: string }> };
  };
  assert.equal(orderList.orderList.total, 1);
  assert.equal(orderList.orderList.items[0]?.orderId, purchase.order.orderId);
  assert.equal(orderList.orderList.items[0]?.skuId, "study_club_plus_monthly");

  const subscriptionsResponse = await app.request("http://localhost/subscriptions", { headers });
  assert.equal(subscriptionsResponse.status, 200);
  const subscriptions = (await subscriptionsResponse.json()) as {
    subscriptions: Array<{ subscriptionId: string; status: string; autoRenew: boolean }>;
  };
  assert.equal(subscriptions.subscriptions[0]?.subscriptionId, purchase.subscription?.subscriptionId);
  assert.equal(subscriptions.subscriptions[0]?.status, "active");
  assert.equal(subscriptions.subscriptions[0]?.autoRenew, true);

  const cancelSubscriptionResponse = await app.request("http://localhost/subscriptions/cancel", {
    method: "POST",
    headers,
    body: JSON.stringify({
      subscriptionId: purchase.subscription?.subscriptionId,
      reason: "pause_next_term",
    }),
  });
  assert.equal(cancelSubscriptionResponse.status, 200);
  const cancelledSubscription = (await cancelSubscriptionResponse.json()) as {
    subscription?: { status: string; autoRenew: boolean };
  };
  assert.equal(cancelledSubscription.subscription?.status, "cancelled");
  assert.equal(cancelledSubscription.subscription?.autoRenew, false);

  const renewSubscriptionResponse = await app.request("http://localhost/subscriptions/renew", {
    method: "POST",
    headers,
    body: JSON.stringify({
      subscriptionId: purchase.subscription?.subscriptionId,
    }),
  });
  assert.equal(renewSubscriptionResponse.status, 200);
  const renewedSubscription = (await renewSubscriptionResponse.json()) as {
    order: { orderId: string };
    subscription?: { subscriptionId: string; status: string; latestOrderId: string };
  };
  assert.equal(renewedSubscription.subscription?.subscriptionId, purchase.subscription?.subscriptionId);
  assert.equal(renewedSubscription.subscription?.status, "active");
  assert.equal(renewedSubscription.subscription?.latestOrderId, renewedSubscription.order.orderId);

  const refundablePurchaseResponse = await app.request("http://localhost/orders/purchase", {
    method: "POST",
    headers,
    body: JSON.stringify({
      skuId: "priority_service_once",
      source: "reader",
    }),
  });
  assert.equal(refundablePurchaseResponse.status, 200);
  const refundablePurchase = (await refundablePurchaseResponse.json()) as {
    order: { orderId: string };
  };

  const refundResponse = await app.request("http://localhost/orders/refund", {
    method: "POST",
    headers,
    body: JSON.stringify({
      orderId: refundablePurchase.order.orderId,
      reason: "service_not_needed",
    }),
  });
  assert.equal(refundResponse.status, 200);

  const afterSalesListResponse = await app.request("http://localhost/after-sales/list", { headers });
  assert.equal(afterSalesListResponse.status, 200);
  const afterSalesList = (await afterSalesListResponse.json()) as {
    cases: Array<{ caseId: string; kind: string; orderId: string }>;
  };
  const refundCase = afterSalesList.cases.find((item) => item.orderId === refundablePurchase.order.orderId);
  assert.equal(refundCase?.kind, "refund");

  const afterSalesDetailResponse = await app.request(`http://localhost/after-sales/detail?caseId=${refundCase?.caseId}`, {
    headers,
  });
  assert.equal(afterSalesDetailResponse.status, 200);
  const afterSalesDetail = (await afterSalesDetailResponse.json()) as {
    caseItem: { caseId: string; kind: string };
    order: { orderId: string };
    operationResult?: { operation: string };
  };
  assert.equal(afterSalesDetail.caseItem.caseId, refundCase?.caseId);
  assert.equal(afterSalesDetail.caseItem.kind, "refund");
  assert.equal(afterSalesDetail.order.orderId, refundablePurchase.order.orderId);
  assert.equal(afterSalesDetail.operationResult?.operation, "refund");
});

test("account asset history stays append-only across pending, callback success, and refund", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "wechat");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };

  const initialHistoryResponse = await app.request("http://localhost/account/assets/history?page=1&pageSize=20", {
    headers,
  });
  assert.equal(initialHistoryResponse.status, 200);
  const initialHistory = (await initialHistoryResponse.json()) as {
    accountSummary: {
      assets: {
        balanceCents: number;
        availableBalanceCents: number;
        frozenBalanceCents: number;
        activeEntitlements: Array<{ status: string; active: boolean }>;
      };
    };
    ledgerEntries: Array<{ ledgerId: string; subject: string; kind: string; entitlement?: { status: string } }>;
    pagination: { total: number };
  };
  const initialBalanceCents = initialHistory.accountSummary.assets.balanceCents;
  assert.equal(initialHistory.accountSummary.assets.availableBalanceCents, initialBalanceCents);
  assert.equal(initialHistory.accountSummary.assets.frozenBalanceCents, 0);
  assert.equal(initialHistory.accountSummary.assets.activeEntitlements.length, 0);
  assert.equal(
    initialHistory.ledgerEntries.some((entry) => entry.subject === "entitlement" && entry.entitlement?.status === "expired"),
    true,
  );

  const pendingPurchaseResponse = await app.request("http://localhost/membership/purchase", {
    method: "POST",
    headers,
    body: JSON.stringify({
      planId: "quarterly",
      paymentScenario: "pending",
      source: "reader",
    }),
  });
  assert.equal(pendingPurchaseResponse.status, 200);
  const pendingPurchase = (await pendingPurchaseResponse.json()) as {
    order: { orderId: string };
  };

  const pendingMeResponse = await app.request("http://localhost/me", { headers });
  const pendingMe = (await pendingMeResponse.json()) as {
    accountSummary: {
      assets: {
        balanceCents: number;
        availableBalanceCents: number;
        frozenBalanceCents: number;
        activeEntitlements: Array<{ status: string; active: boolean }>;
      };
    };
  };
  assert.equal(pendingMe.accountSummary.assets.balanceCents, initialBalanceCents);
  assert.equal(pendingMe.accountSummary.assets.availableBalanceCents, initialBalanceCents - 4900);
  assert.equal(pendingMe.accountSummary.assets.frozenBalanceCents, 4900);
  assert.equal(pendingMe.accountSummary.assets.activeEntitlements.length, 0);

  const callbackResponse = await app.request("http://localhost/payments/callback", {
    method: "POST",
    headers,
    body: JSON.stringify({
      orderId: pendingPurchase.order.orderId,
      outcome: "success",
      verified: true,
      callbackReference: "cb_asset_history_success",
    }),
  });
  assert.equal(callbackResponse.status, 200);
  const callbackPayload = (await callbackResponse.json()) as {
    operationResult?: { assetLedgerIds?: string[] };
  };
  assert.equal(callbackPayload.operationResult?.assetLedgerIds?.length, 3);

  const activeMeResponse = await app.request("http://localhost/me", { headers });
  const activeMe = (await activeMeResponse.json()) as {
    accountSummary: {
      assets: {
        balanceCents: number;
        availableBalanceCents: number;
        frozenBalanceCents: number;
        activeEntitlements: Array<{ status: string; active: boolean; productType: string }>;
      };
    };
  };
  assert.equal(activeMe.accountSummary.assets.balanceCents, initialBalanceCents - 4900);
  assert.equal(activeMe.accountSummary.assets.availableBalanceCents, initialBalanceCents - 4900);
  assert.equal(activeMe.accountSummary.assets.frozenBalanceCents, 0);
  assert.equal(activeMe.accountSummary.assets.activeEntitlements.length, 1);
  assert.equal(activeMe.accountSummary.assets.activeEntitlements[0]?.status, "active");
  assert.equal(activeMe.accountSummary.assets.activeEntitlements[0]?.productType, "membership");

  const refundResponse = await app.request("http://localhost/orders/refund", {
    method: "POST",
    headers,
    body: JSON.stringify({
      orderId: pendingPurchase.order.orderId,
      reason: "duplicate_charge",
    }),
  });
  assert.equal(refundResponse.status, 200);
  const refundPayload = (await refundResponse.json()) as {
    operationResult?: { assetLedgerIds?: string[] };
  };
  assert.equal(refundPayload.operationResult?.assetLedgerIds?.length, 2);

  const finalHistoryResponse = await app.request("http://localhost/account/assets/history?page=1&pageSize=20", {
    headers,
  });
  assert.equal(finalHistoryResponse.status, 200);
  const finalHistory = (await finalHistoryResponse.json()) as {
    accountSummary: {
      assets: {
        balanceCents: number;
        availableBalanceCents: number;
        frozenBalanceCents: number;
        activeEntitlements: Array<{ status: string; active: boolean }>;
      };
    };
    ledgerEntries: Array<{ sourceId?: string; kind: string; entitlement?: { status: string } }>;
    pagination: { total: number };
  };
  assert.equal(finalHistory.pagination.total, initialHistory.pagination.total + 7);
  assert.equal(finalHistory.accountSummary.assets.balanceCents, initialBalanceCents);
  assert.equal(finalHistory.accountSummary.assets.availableBalanceCents, initialBalanceCents);
  assert.equal(finalHistory.accountSummary.assets.frozenBalanceCents, 0);
  assert.equal(finalHistory.accountSummary.assets.activeEntitlements.length, 0);
  assert.equal(
    finalHistory.ledgerEntries.some(
      (entry) => entry.sourceId === pendingPurchase.order.orderId && entry.kind === "refund" && entry.entitlement?.status === "refunded",
    ),
    true,
  );
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
  assert.equal(sent.messageItem.deliveryStatus, "pending");
  assert.equal(sent.messageThread.lastMessagePreview, "Please escalate this consultation case.");

  const syncResponse = await app.request(
    `http://localhost/messages/thread/sync?threadId=thread_consultation_case&cursor=${encodeURIComponent("stale_cursor")}`,
    {
      method: "GET",
      headers,
    },
  );
  assert.equal(syncResponse.status, 200);
  const synced = (await syncResponse.json()) as {
    changed: boolean;
    messageItems: Array<{ body: string; deliveryStatus: string }>;
  };
  assert.equal(synced.changed, true);
  assert.equal(
    synced.messageItems.some(
      (message) => message.body === "Please escalate this consultation case." && message.deliveryStatus === "delivered",
    ),
    true,
  );
});

test("notification touchpoints respect unsubscribe controls and external delivery can fail without losing in-app fallback", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "h5");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };

  const settingsUpdate = await app.request("http://localhost/settings", {
    method: "POST",
    headers,
    body: JSON.stringify({
      featureToggles: {
        smsEnabled: true,
        emailEnabled: true,
      },
      notificationChannels: [
        {
          channel: "email",
          unsubscribed: true,
        },
      ],
    }),
  });
  assert.equal(settingsUpdate.status, 200);

  const notificationsResponse = await app.request("http://localhost/notifications?type=review", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(notificationsResponse.status, 200);
  const notificationsPayload = (await notificationsResponse.json()) as {
    notificationList: {
      items: Array<{
        id: string;
        touchpoints: Array<{ channel: string; receipt?: { status: string }; enabled: boolean }>;
      }>;
    };
  };
  const reviewNotification = notificationsPayload.notificationList.items.find((item) => item.id === "notice_review_profile");
  assert.equal(reviewNotification?.touchpoints.find((touchpoint) => touchpoint.channel === "email")?.receipt?.status, "opted_out");
  assert.equal(reviewNotification?.touchpoints.find((touchpoint) => touchpoint.channel === "in_app")?.receipt?.status, "delivered");

  const sendResponse = await app.request("http://localhost/messages/thread/send", {
    method: "POST",
    headers,
    body: JSON.stringify({
      threadId: "thread_customer_service",
      body: "provider-down on external channels but keep station fallback",
    }),
  });
  assert.equal(sendResponse.status, 200);
  const sendPayload = (await sendResponse.json()) as {
    messageItem: {
      deliveryStatus: string;
      retryable: boolean;
      touchpoints: Array<{ channel: string; receipt?: { status: string; retryable: boolean } }>;
    };
  };
  assert.equal(sendPayload.messageItem.deliveryStatus, "failed");
  assert.equal(sendPayload.messageItem.retryable, true);
  assert.equal(sendPayload.messageItem.touchpoints.find((touchpoint) => touchpoint.channel === "in_app")?.receipt?.status, "delivered");
  assert.equal(sendPayload.messageItem.touchpoints.find((touchpoint) => touchpoint.channel === "subscription_message")?.receipt?.status, "failed");

  const failedMessageIdResponse = await app.request("http://localhost/messages/thread?threadId=thread_customer_service", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  const failedMessageIdPayload = (await failedMessageIdResponse.json()) as {
    messageItems: Array<{ body: string; messageId: string }>;
  };
  const failedMessageId = failedMessageIdPayload.messageItems.find((message) => message.body.includes("provider-down"))?.messageId;
  assert.equal(typeof failedMessageId, "string");

  const retryResponse = await app.request("http://localhost/messages/thread/retry", {
    method: "POST",
    headers,
    body: JSON.stringify({
      threadId: "thread_customer_service",
      messageId: failedMessageId,
    }),
  });
  assert.equal(retryResponse.status, 200);
  const retryPayload = (await retryResponse.json()) as {
    messageItem: {
      deliveryStatus: string;
      touchpoints: Array<{ channel: string; receipt?: { status: string; retryCount: number } }>;
    };
  };
  assert.equal(retryPayload.messageItem.deliveryStatus, "pending");
  assert.equal(retryPayload.messageItem.touchpoints.find((touchpoint) => touchpoint.channel === "subscription_message")?.receipt?.status, "sent");
  assert.equal(retryPayload.messageItem.touchpoints.find((touchpoint) => touchpoint.channel === "subscription_message")?.receipt?.retryCount, 1);

  const syncResponse = await app.request(
    `http://localhost/messages/thread/sync?threadId=thread_customer_service&cursor=${encodeURIComponent("before_retry")}`,
    {
      headers: { authorization: `Bearer ${session.accessToken}` },
    },
  );
  assert.equal(syncResponse.status, 200);
  const syncPayload = (await syncResponse.json()) as {
    messageItems: Array<{
      body: string;
      deliveryStatus: string;
      touchpoints: Array<{ channel: string; receipt?: { status: string } }>;
    }>;
  };
  const retriedMessage = syncPayload.messageItems.find((message) => message.body.includes("provider-down"));
  assert.equal(retriedMessage?.deliveryStatus, "delivered");
  assert.equal(retriedMessage?.touchpoints.find((touchpoint) => touchpoint.channel === "subscription_message")?.receipt?.status, "delivered");
});

test("message touchpoints expose production provider posture while keeping polling-only sync explicit", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await login(app, "h5");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };
  const messageProviderEnv = {
    MINIX_MESSAGE_TOUCHPOINT_PROVIDER_MODE: "production",
    MINIX_MESSAGE_SUBSCRIPTION_PROVIDER_LABEL: "WeChat Subscription Gateway",
    MINIX_MESSAGE_PUSH_PROVIDER_LABEL: "JPush",
    MINIX_MESSAGE_SMS_PROVIDER_LABEL: "Tencent Cloud SMS",
    MINIX_MESSAGE_EMAIL_PROVIDER_LABEL: "Resend",
  } as never;

  const settingsResponse = await app.request(
    "http://localhost/settings",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        featureToggles: {
          smsEnabled: true,
          emailEnabled: true,
        },
      }),
    },
    messageProviderEnv,
  );
  assert.equal(settingsResponse.status, 200);
  const settingsPayload = (await settingsResponse.json()) as {
    notificationChannels: Array<{ channel: string; providerMode?: string; providerLabel: string }>;
  };
  assert.equal(
    settingsPayload.notificationChannels.find((item) => item.channel === "subscription_message")?.providerMode,
    "production",
  );
  assert.equal(
    settingsPayload.notificationChannels.find((item) => item.channel === "push")?.providerLabel,
    "JPush",
  );

  const threadResponse = await app.request(
    "http://localhost/messages/thread?threadId=thread_customer_service",
    {
      headers: { authorization: `Bearer ${session.accessToken}` },
    },
    messageProviderEnv,
  );
  assert.equal(threadResponse.status, 200);
  const threadPayload = (await threadResponse.json()) as {
    messageThread: {
      syncState?: { mode: string; modeLabel?: string; providerSummary?: string };
      supportProgress?: { supportLoopSummary?: string; operatorActionSummary?: string };
      touchpoints: Array<{
        channel: string;
        providerMode?: string;
        providerLabel?: string;
        fallbackSummary?: string;
        deliverySummary?: string;
        template?: { governanceLabel?: string; operatorActionSummary?: string };
      }>;
    };
  };
  assert.equal(threadPayload.messageThread.syncState?.mode, "polling");
  assert.equal(threadPayload.messageThread.syncState?.modeLabel, "Polling-only sync");
  assert.equal(
    threadPayload.messageThread.syncState?.providerSummary,
    "External touchpoints use operator-configured provider posture where available; in-app delivery remains the durable fallback lane.",
  );
  assert.equal(
    threadPayload.messageThread.touchpoints.find((item) => item.channel === "subscription_message")?.providerMode,
    "production",
  );
  assert.equal(
    threadPayload.messageThread.touchpoints.find((item) => item.channel === "subscription_message")?.providerLabel,
    "WeChat Subscription Gateway",
  );
  assert.equal(
    threadPayload.messageThread.touchpoints.find((item) => item.channel === "subscription_message")?.fallbackSummary,
    "If this external lane fails or is skipped, the in-app inbox remains the durable fallback.",
  );
  assert.equal(
    threadPayload.messageThread.touchpoints.find((item) => item.channel === "subscription_message")?.template?.governanceLabel,
    "Shared subscription message template",
  );
  assert.equal(
    threadPayload.messageThread.supportProgress?.supportLoopSummary,
    "Billing Support posted a resolution and keeps the same support thread available for confirmation.",
  );

  const sendResponse = await app.request(
    "http://localhost/messages/thread/send",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        threadId: "thread_customer_service",
        body: "provider-down on production channels",
      }),
    },
    messageProviderEnv,
  );
  assert.equal(sendResponse.status, 200);
  const sendPayload = (await sendResponse.json()) as {
    messageItem: {
      failureMessage?: string;
      touchpoints: Array<{
        channel: string;
        statusLabel?: string;
        deliverySummary?: string;
        providerMode?: string;
        template?: { operatorActionSummary?: string };
        receipt?: { failureMessage?: string; status: string; attemptSummary?: string };
      }>;
    };
    messageThread: {
      supportProgress?: { supportLoopSummary?: string; operatorActionSummary?: string };
    };
  };
  assert.equal(sendPayload.messageItem.failureMessage, "Provider delivery failed; retry and polling-only sync can advance the receipt.");
  assert.equal(
    sendPayload.messageItem.touchpoints.find((item) => item.channel === "subscription_message")?.providerMode,
    "production",
  );
  assert.equal(
    sendPayload.messageItem.touchpoints.find((item) => item.channel === "subscription_message")?.statusLabel,
    "WeChat Subscription Gateway is temporarily unavailable.",
  );
  assert.equal(
    sendPayload.messageItem.touchpoints.find((item) => item.channel === "subscription_message")?.receipt?.failureMessage,
    "WeChat Subscription Gateway is unavailable.",
  );
  assert.equal(
    sendPayload.messageItem.touchpoints.find((item) => item.channel === "subscription_message")?.receipt?.attemptSummary,
    "1 attempts; delivery failed and can be retried.",
  );
  assert.equal(
    sendPayload.messageItem.touchpoints.find((item) => item.channel === "subscription_message")?.deliverySummary,
    "WeChat Subscription Gateway failed to deliver through subscription message; retry or operator intervention can restore the external lane.",
  );
  assert.equal(
    sendPayload.messageItem.touchpoints.find((item) => item.channel === "subscription_message")?.template?.operatorActionSummary,
    "Operators can rotate subscription message provider bindings while keeping the shared template key stable.",
  );
  assert.equal(
    sendPayload.messageThread.supportProgress?.supportLoopSummary,
    "Billing Support is waiting for more user context before continuing the shared support loop.",
  );
  assert.equal(
    sendPayload.messageThread.supportProgress?.operatorActionSummary,
    "Billing Support can rotate assignments, templates, and delivery providers without changing the polling-only transport contract.",
  );
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
  assert.equal(oauthBody.identity.wechatBound, undefined);
});

test("oauth providers can be bound, revoked, and unlinked with account safety checks", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });
  const session = await loginWithPhoneCode(app, "13800000001");

  const bindAuthorize = await app.request("http://localhost/auth/oauth/authorize", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify({
      provider: "wechat-open-platform",
      purpose: "bind",
    }),
  });
  assert.equal(bindAuthorize.status, 200);
  const bindAuthorizePayload = (await bindAuthorize.json()) as { state: string; purpose?: string };
  assert.equal(bindAuthorizePayload.purpose, "bind");

  const bindResponse = await app.request("http://localhost/auth/identity/bind-oauth", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify({
      provider: "wechat-open-platform",
      state: bindAuthorizePayload.state,
      providerToken: "oauth-token-valid",
      providerUserId: "provider-user-1",
    }),
  });
  assert.equal(bindResponse.status, 200);
  const bindPayload = (await bindResponse.json()) as {
    accessToken: string;
    identityWorkflow: { kind: string; status: string };
  };
  assert.equal(bindPayload.identityWorkflow.kind, "oauth_binding");
  assert.equal(bindPayload.identityWorkflow.status, "completed");

  const meResponse = await app.request("http://localhost/me", {
    headers: { authorization: `Bearer ${bindPayload.accessToken}` },
  });
  assert.equal(meResponse.status, 200);
  const mePayload = (await meResponse.json()) as {
    accountSummary: {
      providerIdentities?: Array<{
        provider: string;
        providerUserId: string;
        authorizationStatus: string;
        actions: Array<{ kind: string; available: boolean }>;
      }>;
    };
  };
  assert.equal(mePayload.accountSummary.providerIdentities?.[0]?.provider, "wechat-open-platform");
  assert.equal(mePayload.accountSummary.providerIdentities?.[0]?.authorizationStatus, "active");

  const revokeSecurityCode = await requestPhoneCode(app, "13800000001", "account_security", bindPayload.accessToken);
  const revokeResponse = await app.request("http://localhost/account/provider/revoke", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${bindPayload.accessToken}`,
    },
    body: JSON.stringify({
      provider: "wechat-open-platform",
      providerUserId: "provider-user-1",
      verificationCode: revokeSecurityCode,
      riskConfirmed: true,
      reason: "security_review",
    }),
  });
  assert.equal(revokeResponse.status, 200);
  const revokePayload = (await revokeResponse.json()) as {
    accountSummary: { providerIdentities?: Array<{ authorizationStatus: string }> };
    operationRecord?: { kind: string; status: string };
  };
  assert.equal(revokePayload.operationRecord?.kind, "revoke_provider");
  assert.equal(revokePayload.operationRecord?.status, "completed");
  assert.equal(revokePayload.accountSummary.providerIdentities?.[0]?.authorizationStatus, "revoked");

  const unlinkAuthorize = await app.request("http://localhost/auth/oauth/authorize", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${bindPayload.accessToken}`,
    },
    body: JSON.stringify({
      provider: "wechat-open-platform",
      purpose: "bind",
    }),
  });
  const unlinkAuthorizePayload = (await unlinkAuthorize.json()) as { state: string };
  const rebindResponse = await app.request("http://localhost/auth/identity/bind-oauth", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${bindPayload.accessToken}`,
    },
    body: JSON.stringify({
      provider: "wechat-open-platform",
      state: unlinkAuthorizePayload.state,
      providerToken: "oauth-token-valid-next",
      providerUserId: "provider-user-1",
    }),
  });
  assert.equal(rebindResponse.status, 200);
  const rebindPayload = (await rebindResponse.json()) as { accessToken: string };

  const unlinkSecurityCode = await requestPhoneCode(app, "13800000001", "account_security", rebindPayload.accessToken);
  const unlinkResponse = await app.request("http://localhost/account/provider/unlink", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${rebindPayload.accessToken}`,
    },
    body: JSON.stringify({
      provider: "wechat-open-platform",
      providerUserId: "provider-user-1",
      verificationCode: unlinkSecurityCode,
      riskConfirmed: true,
    }),
  });
  assert.equal(unlinkResponse.status, 200);
  const unlinkPayload = (await unlinkResponse.json()) as {
    accountSummary: { providerIdentities?: Array<{ authorizationStatus: string }> };
    operationRecord?: { kind: string; status: string };
  };
  assert.equal(unlinkPayload.operationRecord?.kind, "unlink_provider");
  assert.equal(unlinkPayload.operationRecord?.status, "completed");
  assert.equal(unlinkPayload.accountSummary.providerIdentities?.[0]?.authorizationStatus, "unlinked");
});

test("oauth binding conflicts surface merge guidance and provider safety prevents lockout", async () => {
  const app = createApiApp({ store: createMemoryApiStore() });

  const existingOwner = await loginWithPhoneCode(app, "13800000033");
  const existingBindAuthorize = await app.request("http://localhost/auth/oauth/authorize", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${existingOwner.accessToken}`,
    },
    body: JSON.stringify({
      provider: "wechat-open-platform",
      purpose: "bind",
    }),
  });
  const existingBindAuthorizePayload = (await existingBindAuthorize.json()) as { state: string };
  const existingBind = await app.request("http://localhost/auth/identity/bind-oauth", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${existingOwner.accessToken}`,
    },
    body: JSON.stringify({
      provider: "wechat-open-platform",
      state: existingBindAuthorizePayload.state,
      providerToken: "oauth-token-owner",
      providerUserId: "provider-user-conflict",
    }),
  });
  assert.equal(existingBind.status, 200);

  const challenger = await login(app, "h5");
  const challengerAuthorize = await app.request("http://localhost/auth/oauth/authorize", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${challenger.accessToken}`,
    },
    body: JSON.stringify({
      provider: "wechat-open-platform",
      purpose: "bind",
    }),
  });
  const challengerAuthorizePayload = (await challengerAuthorize.json()) as { state: string };
  const conflictResponse = await app.request("http://localhost/auth/identity/bind-oauth", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${challenger.accessToken}`,
    },
    body: JSON.stringify({
      provider: "wechat-open-platform",
      state: challengerAuthorizePayload.state,
      providerToken: "oauth-token-challenger",
      providerUserId: "provider-user-conflict",
    }),
  });
  assert.equal(conflictResponse.status, 200);
  const conflictPayload = (await conflictResponse.json()) as {
    identityWorkflow?: { kind: string; status: string; targetUserId?: string };
  };
  assert.equal(conflictPayload.identityWorkflow?.kind, "oauth_binding");
  assert.equal(conflictPayload.identityWorkflow?.status, "merge_required");
  assert.equal(conflictPayload.identityWorkflow?.targetUserId, existingOwner.userId);

  const oauthOnlyAuthorize = await app.request("http://localhost/auth/oauth/authorize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      provider: "wechat-open-platform",
    }),
  });
  const oauthOnlyAuthorizePayload = (await oauthOnlyAuthorize.json()) as { state: string };
  const oauthOnlyLogin = await app.request("http://localhost/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      platform: "h5",
      credential: {
        method: "oauth",
        provider: "wechat-open-platform",
        providerToken: "oauth-token-only",
        providerUserId: "provider-user-only",
        oauthState: oauthOnlyAuthorizePayload.state,
      },
    }),
  });
  assert.equal(oauthOnlyLogin.status, 200);
  const oauthOnlyPayload = (await oauthOnlyLogin.json()) as { accessToken: string };
  const blockedUnlink = await app.request("http://localhost/account/provider/unlink", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${oauthOnlyPayload.accessToken}`,
    },
    body: JSON.stringify({
      provider: "wechat-open-platform",
      providerUserId: "provider-user-only",
      verificationCode: "123456",
      riskConfirmed: true,
    }),
  });
  assert.equal(blockedUnlink.status, 409);
  const blockedPayload = (await blockedUnlink.json()) as {
    transitionMessage: string;
    operationRecords: Array<{ kind: string; status: string }>;
  };
  assert.match(blockedPayload.transitionMessage, /last usable login method/i);
  assert.equal(blockedPayload.operationRecords[0]?.kind, "unlink_provider");
  assert.equal(blockedPayload.operationRecords[0]?.status, "blocked");
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
    riskDecision?: { level: string; reason?: string; score?: number; repeatedDevice?: boolean; operatorActionSummary?: string };
    deviceIdentity?: { deviceId: string; trusted: boolean; trustLabel?: string; trustScore?: number };
    rateLimitState?: { scope: string; limited: boolean };
    securityAuditEvents?: Array<{ scope: string; action: string; result: string }>;
  };
  assert.equal(payload.abnormalLoginPrompt?.title, "Unusual sign-in detected");
  assert.equal(payload.abnormalLoginPrompt?.severity, "warning");
  assert.equal(payload.riskDecision?.level, "review");
  assert.equal(payload.riskDecision?.score, 24);
  assert.equal(payload.riskDecision?.repeatedDevice, false);
  assert.match(payload.riskDecision?.operatorActionSummary ?? "", /force re-authentication/i);
  assert.equal(payload.deviceIdentity?.deviceId, "device-risk-review");
  assert.equal(payload.deviceIdentity?.trusted, false);
  assert.equal(payload.deviceIdentity?.trustLabel, "review");
  assert.equal(payload.deviceIdentity?.trustScore, 24);
  assert.equal(payload.rateLimitState?.scope, "auth");
  assert.equal(payload.rateLimitState?.limited, false);
  assert.equal(payload.securityAuditEvents?.some((event) => event.scope === "auth" && event.action === "password_login"), true);
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
      recoverySummary?: string;
      operatorActionSummary?: string;
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
  assert.match(bindPayload.identityWorkflow.recoverySummary ?? "", /retry the merge preview/i);
  assert.match(bindPayload.identityWorkflow.operatorActionSummary ?? "", /confirming the merge/i);
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
      recoverySummary?: string;
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
  assert.match(mergePayload.identityWorkflow.recoverySummary ?? "", /durable recovery point/i);
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
      recoverySummary?: string;
      operatorActionSummary?: string;
      audit?: Array<{ action: string }>;
    };
  };
  assert.equal(cancelPayload.identity.userId, "minix-demo-user");
  assert.equal(cancelPayload.identityWorkflow.kind, "phone_binding");
  assert.equal(cancelPayload.identityWorkflow.status, "blocked");
  assert.equal(cancelPayload.identityWorkflow.stage, "failed");
  assert.equal(cancelPayload.identityWorkflow.failureReason, "merge_confirmation_required");
  assert.match(cancelPayload.identityWorkflow.recoverySummary ?? "", /No merge was applied/i);
  assert.match(cancelPayload.identityWorkflow.operatorActionSummary ?? "", /before retrying/i);
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

test("operational diagnostics persist job queues across app restarts and manual runs stay idempotent", async () => {
  const store = createMemoryApiStore();
  const app = createApiApp({ store });
  const session = await loginWithPhoneCode(app, "13800000011");
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    "content-type": "application/json",
  };

  const upload = await uploadContentAsset(app, session.accessToken, {
    taskId: "ops_upload_cleanup",
    assetId: "ops_asset_cleanup",
    fileName: "ops-cleanup.png",
  });

  const uploadCancelResponse = await app.request("http://localhost/uploads/cancel", {
    method: "POST",
    headers,
    body: JSON.stringify({
      taskId: upload.uploadTask.taskId,
      reason: "ops cleanup verification",
    }),
  });
  assert.equal(uploadCancelResponse.status, 200);

  const sendResponse = await app.request("http://localhost/messages/thread/send", {
    method: "POST",
    headers,
    body: JSON.stringify({
      threadId: "thread_customer_service",
      body: "provider-down on external channels for ops retry coverage",
    }),
  });
  assert.equal(sendResponse.status, 200);
  const sendPayload = (await sendResponse.json()) as {
    messageItem: { messageId: string; deliveryStatus: string; retryable: boolean };
  };
  assert.equal(sendPayload.messageItem.deliveryStatus, "failed");
  assert.equal(sendPayload.messageItem.retryable, true);

  const purchaseResponse = await app.request("http://localhost/membership/purchase", {
    method: "POST",
    headers,
    body: JSON.stringify({
      planId: "quarterly",
      paymentScenario: "pending",
      providerMode: "sample",
      idempotencyKey: "ops-pending-membership",
    }),
  });
  assert.equal(purchaseResponse.status, 200);
  const purchasePayload = (await purchaseResponse.json()) as {
    order: { orderId: string; status: string };
  };
  assert.equal(purchasePayload.order.status, "pending_payment");

  const securityCode = await requestPhoneCode(app, "13800000001", "account_security", session.accessToken);
  const cancellationResponse = await app.request("http://localhost/account/cancellation", {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: "request",
      confirm: true,
      riskConfirmed: true,
      verificationCode: securityCode,
      reason: "other",
      details: "ops baseline verification",
    }),
  });
  assert.equal(cancellationResponse.status, 200);

  const diagnosticsResponse = await app.request("http://localhost/ops/diagnostics?includeCompletedJobs=true&limit=20", {
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(diagnosticsResponse.status, 200);
  const diagnosticsPayload = (await diagnosticsResponse.json()) as {
    backgroundJobs: Array<{ kind: string; status: string }>;
    governance: { queuedJobs: number; retryableNotifications: number };
    migrations: Array<{ migrationId: string }>;
    providerReadiness: { payment: { callbacks: { status: string } } };
    environmentSummary: { deployEnv: string; releasePosture: string; comparableStatuses: { paymentCallbacks: string } };
    evidencePack: { deployEnv: string; compareKey: string; releasePosture: string };
  };
  assert.equal(diagnosticsPayload.backgroundJobs.some((job) => job.kind === "upload_cleanup"), true);
  assert.equal(diagnosticsPayload.backgroundJobs.some((job) => job.kind === "notification_retry"), true);
  assert.equal(diagnosticsPayload.backgroundJobs.some((job) => job.kind === "payment_reconciliation"), true);
  assert.equal(diagnosticsPayload.backgroundJobs.some((job) => job.kind === "cancellation_expiry"), true);
  assert.equal(diagnosticsPayload.governance.queuedJobs >= 4, true);
  assert.equal(diagnosticsPayload.governance.retryableNotifications >= 1, true);
  assert.equal(diagnosticsPayload.migrations.some((migration) => migration.migrationId === "user_state_backfill_v1"), true);
  assert.equal(diagnosticsPayload.providerReadiness.payment.callbacks.status, "review");
  assert.equal(diagnosticsPayload.environmentSummary.deployEnv, "local");
  assert.equal(diagnosticsPayload.environmentSummary.comparableStatuses.paymentCallbacks, "review");
  assert.equal(diagnosticsPayload.evidencePack.deployEnv, "local");
  assert.equal(diagnosticsPayload.evidencePack.compareKey.includes("paymentCallbacks:review"), true);

  const operationalState = structuredClone(await store.getOperationalState());
  const cancellationJob = operationalState.backgroundJobs.find((job) => job.kind === "cancellation_expiry");
  assert.ok(cancellationJob);
  cancellationJob.scheduledAt = new Date(Date.now() - 1_000).toISOString();
  await store.saveOperationalState(operationalState);

  const restartedApp = createApiApp({ store });
  const runJobsResponse = await restartedApp.request("http://localhost/ops/jobs/run", {
    method: "POST",
    headers,
    body: JSON.stringify({
      limit: 20,
    }),
  });
  assert.equal(runJobsResponse.status, 200);
  const runJobsPayload = (await runJobsResponse.json()) as {
    processedJobs: Array<{ kind: string; status: string }>;
    diagnostics: {
      governance: { queuedJobs: number; retryableNotifications: number };
      providerReadiness: { payment: { callbacks: { status: string } } };
      environmentSummary: { releasePosture: string };
      evidencePack: { compareKey: string };
    };
  };
  assert.equal(runJobsPayload.processedJobs.some((job) => job.kind === "upload_cleanup" && job.status === "completed"), true);
  assert.equal(runJobsPayload.processedJobs.some((job) => job.kind === "notification_retry" && job.status === "completed"), true);
  assert.equal(runJobsPayload.processedJobs.some((job) => job.kind === "payment_reconciliation" && job.status === "completed"), true);
  assert.equal(runJobsPayload.processedJobs.some((job) => job.kind === "cancellation_expiry" && job.status === "completed"), true);
  assert.equal(runJobsPayload.diagnostics.governance.queuedJobs, 0);
  assert.equal(runJobsPayload.diagnostics.governance.retryableNotifications, 0);
  assert.equal(runJobsPayload.diagnostics.providerReadiness.payment.callbacks.status, "review");
  assert.equal(runJobsPayload.diagnostics.environmentSummary.releasePosture, "mixed");
  assert.equal(runJobsPayload.diagnostics.evidencePack.compareKey.includes("paymentCallbacks:review"), true);

  const rerunJobsResponse = await restartedApp.request("http://localhost/ops/jobs/run", {
    method: "POST",
    headers,
    body: JSON.stringify({
      limit: 20,
    }),
  });
  assert.equal(rerunJobsResponse.status, 200);
  const rerunJobsPayload = (await rerunJobsResponse.json()) as {
    processedJobs: Array<unknown>;
  };
  assert.equal(rerunJobsPayload.processedJobs.length, 0);

  const userState = await store.getUserState(session.userId);
  assert.equal(userState.uploadsByTaskId[upload.uploadTask.taskId]?.uploadTask.lifecycle.retentionStatus, "expired");
  assert.equal(userState.ordersById[purchasePayload.order.orderId]?.reconciliation?.status, "reconciled");
  assert.equal(userState.availabilityStatus, "frozen");
  assert.equal(userState.pendingCancellation, undefined);
  const retriedMessage = Object.values(userState.threadRecordsById)
    .flatMap((thread) => thread.messages)
    .find((message) => message.messageId === sendPayload.messageItem.messageId);
  assert.equal(
    retriedMessage?.deliveryStatus === "pending" || retriedMessage?.deliveryStatus === "delivered",
    true,
  );
  assert.equal(retriedMessage?.retryable, false);
});
