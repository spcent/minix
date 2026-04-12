import test from "node:test";
import assert from "node:assert/strict";

import { ok, type AppKernel, type Result, type UserSession } from "@minix/core";
import {
  APP_ROUTE_IDS,
  type CurrentUserResponse,
  type UserAssetHistoryResponse,
  type UserRelationListResponse,
} from "@minix/contracts";

import { createAccountController } from "./index";
import { createDefaultAccountState } from "../model";

function createAssetSummary(
  overrides: Partial<CurrentUserResponse["accountSummary"]["assets"]> = {},
): CurrentUserResponse["accountSummary"]["assets"] {
  const membership = overrides.membership ?? {
    active: false,
    tier: "guest",
    entitlementScope: "none",
    statusLabel: "Guest mode",
    renewalLabel: "Upgrade anytime",
    headline: "Guest",
    subheadline: "Guest",
    benefits: [],
  };
  const balanceCents = overrides.balanceCents ?? 0;
  const frozenBalanceCents = overrides.frozenBalanceCents ?? 0;

  return {
    points: overrides.points ?? 1280,
    level: overrides.level ?? 4,
    membership,
    entitlementLabels: overrides.entitlementLabels ?? ["basic-access"],
    balanceCents,
    availableBalanceCents: overrides.availableBalanceCents ?? balanceCents - frozenBalanceCents,
    frozenBalanceCents,
    activeEntitlements: overrides.activeEntitlements ?? [],
  };
}

function createSecurityCenter(
  overrides: Partial<CurrentUserResponse["securityCenter"]> = {},
): CurrentUserResponse["securityCenter"] {
  return {
    deviceIdentities: overrides.deviceIdentities ?? [],
    auditEvents: overrides.auditEvents ?? [],
    ...(overrides.latestRateLimit ? { latestRateLimit: overrides.latestRateLimit } : {}),
    ...(overrides.latestPrompt ? { latestPrompt: overrides.latestPrompt } : {}),
  };
}

function createKernelStub() {
  const routeCalls: Array<{ routeId: string; params?: Record<string, string | number | boolean> }> = [];
  const clipboardWrites: string[] = [];
  const storageValues = new Map<string, unknown>();
  let requestMode: "success" | "unauthorized" = "success";
  const postCalls: Array<{ path: string; body: unknown }> = [];
  let relationListResponse: UserRelationListResponse = {
    accountSummary: {
      userId: "user-12345",
      phoneBound: true,
      phoneNumberMasked: "138****0001",
      wechatBound: false,
      realNameStatus: "unverified",
      assets: createAssetSummary(),
      relations: {
        followingCount: 3,
        followerCount: 2,
        friendCount: 2,
        blockedCount: 1,
        remarkName: "Coach Lin",
      },
    },
    userStatus: {
      availability: "enabled",
      enabled: true,
      frozen: false,
      cancellationInProgress: false,
      blacklisted: false,
      guest: false,
    },
    relationList: {
      kind: "following" as const,
      items: [
        {
          targetUserId: "practice_buddy",
          displayName: "Practice Buddy",
          relationshipSummary: "Pending friend request",
          following: true,
          followedBy: false,
          friend: false,
          friendState: "outgoing_request" as const,
          blocked: false,
          remarkName: "Grammar buddy",
          actions: [
            { kind: "unfollow" as const, label: "Unfollow", available: true, active: true },
            { kind: "block" as const, label: "Block", available: true },
            { kind: "set_remark" as const, label: "Update remark", available: true, requiresInput: true, active: true },
            { kind: "clear_remark" as const, label: "Clear remark", available: true, active: true },
          ],
          listKind: "following" as const,
        },
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        hasMore: false,
        total: 1,
      },
      keyword: "Practice",
    },
  };
  let assetHistoryResponse: UserAssetHistoryResponse = {
    accountSummary: relationListResponse.accountSummary,
    ledgerEntries: [
      {
        ledgerId: "asset_ledger_balance_seed",
        subject: "balance" as const,
        kind: "grant" as const,
        title: "Wallet seed",
        message: "Initial wallet balance seeded for the sample account.",
        createdAt: "2026-04-01T08:00:00.000Z",
        sourceType: "system" as const,
        sourceId: "seed_balance",
        balanceDeltaCents: 6800,
      },
      {
        ledgerId: "asset_ledger_entitlement_seed",
        subject: "entitlement" as const,
        kind: "expire" as const,
        title: "Expired bonus entitlement",
        message: "A past bonus entitlement expired before the current session.",
        createdAt: "2026-03-01T08:00:00.000Z",
        sourceType: "system" as const,
        sourceId: "seed_entitlement",
        entitlement: {
          entitlementId: "ent_bonus_expired",
          key: "bonus-consultation",
          label: "Bonus consultation",
          status: "expired" as const,
          active: false,
          productType: "benefit" as const,
          expiresAt: "2026-03-01T08:00:00.000Z",
        },
      },
    ],
    pagination: {
      page: 1,
      pageSize: 10,
      hasMore: false,
      total: 2,
    },
  };
  let sessionValue: UserSession | null = {
    loggedIn: true,
    platform: "h5",
    identity: { userId: "user-12345" },
    profile: {
      nickname: "Casey",
      avatarUrl: "https://img.test/avatar.png",
    },
    token: {
      accessToken: "token-1",
      refreshToken: "refresh-1",
      expiresAt: Date.now() + 60_000,
    },
  };
  let userResponse: CurrentUserResponse = {
    userProfile: {
      nickname: "Casey",
      avatarUrl: "https://img.test/avatar.png",
      gender: "unknown",
      region: "Shanghai, CN",
      bio: "Member profile and recovery controls.",
      tags: ["member-ready", "cross-host"],
    },
    accountSummary: {
      userId: "user-12345",
      phoneBound: true,
      phoneNumberMasked: "138****0001",
      wechatBound: false,
      providerIdentities: [
        {
          provider: "wechat-open-platform",
          providerLabel: "WeChat Open Platform",
          providerUserId: "provider-user-1",
          authorizationStatus: "active",
          loginEnabled: true,
          linkedAt: "2026-04-10T08:00:00.000Z",
          lastAuthorizedAt: "2026-04-10T08:10:00.000Z",
          actions: [
            {
              kind: "unlink",
              label: "Unlink provider",
              available: true,
              destructive: true,
            },
            {
              kind: "revoke",
              label: "Revoke authorization",
              available: true,
              destructive: true,
            },
          ],
        },
      ],
      realNameStatus: "unverified",
      assets: createAssetSummary(),
      relations: {
        followingCount: 12,
        followerCount: 28,
        friendCount: 6,
        blockedCount: 1,
        remarkName: "MiniX User",
      },
    },
    userStatus: {
      availability: "enabled",
      enabled: true,
      frozen: false,
      cancellationInProgress: false,
      blacklisted: false,
      guest: false,
    },
    identityWorkflows: {
      canUpgradeGuest: false,
      canBindPhone: false,
      mergePending: false,
    },
    securityCenter: createSecurityCenter({
      latestPrompt: {
        title: "Review unusual account activity",
        message: "A recent sensitive action may need confirmation.",
        severity: "warning",
        scope: "account",
      },
      auditEvents: [
        {
          eventId: "security_1",
          scope: "account",
          action: "change_phone",
          result: "allowed",
          message: "Phone binding updated after verification.",
          createdAt: "2026-04-10T08:00:00.000Z",
        },
      ],
    }),
    accountOperations: [
      {
        kind: "edit_profile",
        label: "Edit profile",
        available: true,
        statusLabel: "You can update nickname, region, and bio.",
      },
      {
        kind: "change_phone",
        label: "Change phone",
        available: true,
        statusLabel: "A verified phone can be replaced.",
        verificationRequired: true,
        riskPrompt: {
          title: "Phone replacement changes recovery credentials",
          message: "Confirm the current device owner and validate both phone numbers before replacing the bound phone.",
          severity: "warning",
        },
      },
      {
        kind: "unbind_wechat",
        label: "Unbind WeChat",
        available: false,
        statusLabel: "No WeChat binding is active.",
        blockedReason: "No WeChat binding is active.",
      },
      {
        kind: "request_cancellation",
        label: "Request cancellation",
        available: true,
        statusLabel: "Submit a cancellation request for the current account.",
        verificationRequired: true,
        riskPrompt: {
          title: "Cancellation schedules irreversible account closure",
          message: "The request enters a cooling-off period first. During that window you can still revoke it.",
          severity: "critical",
        },
      },
      {
        kind: "revoke_cancellation",
        label: "Revoke cancellation",
        available: false,
        statusLabel: "No cancellation request is pending.",
        blockedReason: "No cancellation request is pending.",
      },
    ],
    operationRecords: [],
    relationTargets: [
      {
        targetUserId: "creator_sample",
        displayName: "MiniX Mentor",
        relationshipSummary: "Mutual connection",
        following: true,
        followedBy: true,
        friend: true,
        blocked: false,
        remarkName: "MiniX User",
        actions: [
          {
            kind: "unfollow",
            label: "Unfollow",
            available: true,
            active: true,
          },
          {
            kind: "block",
            label: "Block",
            available: true,
          },
          {
            kind: "clear_remark",
            label: "Clear remark",
            available: true,
            active: true,
          },
        ],
      },
    ],
  };
  let postResult: Result<unknown> = ok({
    userId: "user-12345",
    accessToken: "token-2",
    refreshToken: "refresh-2",
    expiresAt: Date.now() + 60_000,
    session: {
      accessToken: "token-2",
      refreshToken: "refresh-2",
      expiresAt: Date.now() + 60_000,
      issuedAt: Date.now(),
      tokenType: "Bearer",
    },
    identity: {
      userId: "user-12345",
      phoneBound: true,
      wechatBound: true,
      loginMethod: "wechat_code",
    },
    authStatus: "authenticated",
    identityWorkflow: {
      kind: "phone_binding",
      status: "completed",
      sourceUserId: "user-12345",
      targetUserId: "user-12345",
      message: "The current account is now bound to the verified phone number.",
    },
  });

  const kernel: AppKernel = {
    env: {
      appId: "test",
      appName: "test",
      apiBaseUrl: "https://mock.minix.local",
      debug: true,
      platform: "h5",
      version: "1.0.0",
    },
    features: {
      enableAutoLogin: false,
      enableRouteGuard: false,
    },
    storage: {
      async get<T>(key: string) {
        return ok((storageValues.get(key) as T | undefined) ?? null);
      },
      async set<T>(key: string, value: T) {
        storageValues.set(key, value);
        return ok(undefined);
      },
      async remove(key: string) {
        storageValues.delete(key);
        return ok(undefined);
      },
      async clear() {
        storageValues.clear();
        return ok(undefined);
      },
    },
    session: {
      async get() {
        return ok(sessionValue);
      },
      async set(nextSession) {
        sessionValue = nextSession;
        return ok(undefined);
      },
      async clear() {
        return ok(undefined);
      },
      async isLoggedIn() {
        return ok(true);
      },
    },
    request: {
      async get<T>(path?: string) {
        if (requestMode === "unauthorized") {
          return {
            ok: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Account session expired",
              recoverable: true,
            },
          } as const;
        }

        if (path?.startsWith("/account/relations/list")) {
          return ok(relationListResponse as T);
        }

        if (path?.startsWith("/account/assets/history")) {
          return ok(assetHistoryResponse as T);
        }

        return ok(userResponse as T);
      },
      async post<T>(path: string, body?: unknown) {
        postCalls.push({ path, body });
        if (postResult.ok) {
          if (path.startsWith("/auth/identity/")) {
            const payload = postResult.value as {
              identity?: { phoneBound?: boolean; wechatBound?: boolean };
              identityWorkflow?: CurrentUserResponse["identityWorkflows"]["lastWorkflow"];
            };
            userResponse = {
              ...userResponse,
              accountSummary: {
                ...userResponse.accountSummary,
                phoneBound: payload.identity?.phoneBound ?? userResponse.accountSummary.phoneBound,
                wechatBound: payload.identity?.wechatBound ?? userResponse.accountSummary.wechatBound,
              },
              identityWorkflows: {
                ...userResponse.identityWorkflows,
                mergePending: payload.identityWorkflow?.status === "merge_required",
                ...(payload.identityWorkflow?.status === "merge_required"
                  ? { pendingWorkflow: payload.identityWorkflow }
                  : {}),
                ...(payload.identityWorkflow ? { lastWorkflow: payload.identityWorkflow } : {}),
              },
            };
          } else if (path.startsWith("/account/")) {
            const payload = postResult.value as Partial<CurrentUserResponse> & { transitionMessage?: string };
            userResponse = {
              ...userResponse,
              ...(payload.userProfile ? { userProfile: payload.userProfile } : {}),
              ...(payload.accountSummary ? { accountSummary: payload.accountSummary } : {}),
              ...(payload.userStatus ? { userStatus: payload.userStatus } : {}),
              ...(payload.securityCenter ? { securityCenter: payload.securityCenter } : {}),
              ...(payload.accountOperations ? { accountOperations: payload.accountOperations } : {}),
              ...(payload.operationRecords ? { operationRecords: payload.operationRecords } : {}),
              ...(payload.relationTargets ? { relationTargets: payload.relationTargets } : {}),
            };
          }
        }
        return postResult as Result<T>;
      },
      async put<T>() {
        return ok({} as T);
      },
      async patch<T>() {
        return ok({} as T);
      },
      async delete<T>() {
        return ok({} as T);
      },
    },
    auth: {} as AppKernel["auth"],
    router: {
      async to() {
        return ok(undefined);
      },
      async replace() {
        return ok(undefined);
      },
      async toRoute(routeId, params) {
        routeCalls.push({ routeId, ...(params ? { params } : {}) });
        return ok(undefined);
      },
      async replaceRoute(routeId, params) {
        routeCalls.push({ routeId, ...(params ? { params } : {}) });
        return ok(undefined);
      },
      resolve() {
        return ok("/account");
      },
      async back() {
        return ok(undefined);
      },
      current() {
        return ok({ path: "/account" });
      },
    },
    ui: {} as AppKernel["ui"],
    capability: {
      status(capability) {
        return ok({
          capability,
          available: capability === "clipboard",
          mode: capability === "clipboard" ? "native" : "unavailable",
          detail: capability === "clipboard" ? "Clipboard is available." : "Capability is unavailable.",
        });
      },
      async execute(input) {
        clipboardWrites.push(String((input.payload as { text?: unknown } | undefined)?.text ?? ""));
        return ok({
          capability: input.capability,
          action: input.action,
        });
      },
    },
  };

  return {
    kernel,
    routeCalls,
    clipboardWrites,
    storageValues,
    postCalls,
    setRequestMode(mode: "success" | "unauthorized") {
      requestMode = mode;
    },
    setUserResponse(nextResponse: CurrentUserResponse) {
      userResponse = nextResponse;
    },
    setSession(nextSession: UserSession | null) {
      sessionValue = nextSession;
    },
    setRelationListResponse(nextResponse: typeof relationListResponse) {
      relationListResponse = nextResponse;
    },
    setAssetHistoryResponse(nextResponse: typeof assetHistoryResponse) {
      assetHistoryResponse = nextResponse;
    },
    setPostResult(nextResult: Result<unknown>) {
      postResult = nextResult;
    },
  };
}

test("account controller loads session-backed account details and remote profile data", async () => {
  const { kernel } = createKernelStub();
  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    initialState: createDefaultAccountState(),
  });

  const result = await controller.loadInitial();

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.equal(controller.store.getState().ready, true);
  assert.equal(controller.store.getState().authenticated, true);
  assert.equal(controller.store.getState().nickname, "Casey");
  assert.equal(controller.store.getState().subtitle, "Tags: member-ready, cross-host");
  assert.equal(controller.store.getState().stats[0]?.label, "Membership");
  assert.equal(controller.store.getState().sections[0]?.key, "identity");
  assert.equal(controller.store.getState().sections[1]?.key, "account");
  assert.equal(controller.store.getState().assetLedgerEntries.length, 2);
  assert.equal(controller.store.getState().sections.some((section) => section.key === "asset-ledger"), true);
  assert.equal(controller.store.getState().sections.some((section) => section.key === "security-center"), true);
});

test("account controller redirects to login when the account request comes back unauthorized", async () => {
  const { kernel, routeCalls, setRequestMode } = createKernelStub();
  setRequestMode("unauthorized");
  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
  });

  const result = await controller.loadInitial();

  assert.equal(result.ok, false);
  assert.equal(controller.store.getState().authenticated, false);
  assert.equal(controller.store.getState().errorText, "Your account session expired. Sign in again to continue.");
  assert.deepEqual(routeCalls.at(-1), {
    routeId: "auth.login",
    params: {
      redirectPath: "/account",
      redirectSource: "account",
      redirectReason: "auth-required",
    },
  });
});

test("account controller can copy the current user id through the clipboard capability", async () => {
  const { kernel, clipboardWrites } = createKernelStub();
  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
  });

  await controller.loadInitial();
  const result = await controller.copyUserId();

  assert.equal(result.ok, true);
  assert.deepEqual(clipboardWrites, ["user-12345"]);
  assert.equal(controller.store.getState().copyFeedback, "User ID copied for support and recovery.");
});

test("account controller exposes a step-based draftable profile form workflow", async () => {
  const { kernel, storageValues } = createKernelStub();
  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
  });

  await controller.loadInitial();
  controller.openOperationForm("edit_profile");
  controller.updateOperationValues({
    nickname: "Draft Casey",
    includeBio: true,
  });

  assert.deepEqual(controller.store.getState().workflow.stepKeys, ["profile", "preferences", "confirm"]);
  assert.equal(controller.store.getState().workflow.currentStepKey, "profile");
  assert.equal(controller.store.getState().workflow.visibleFieldKeys.includes("bio"), true);
  assert.equal(controller.store.getState().workflow.conditionalFieldKeys.includes("bio"), true);

  await controller.saveOperationDraft();

  assert.equal(controller.store.getState().submitState.mode, "draft");
  assert.equal(controller.store.getState().submitState.phase, "idle");
  assert.equal(storageValues.has("@minix/account/operation-form-draft/v1"), true);
});

test("account controller restores saved drafts and blocks duplicate draft saves", async () => {
  const { kernel } = createKernelStub();
  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
  });

  await controller.loadInitial();
  controller.openOperationForm("edit_profile");
  controller.setOperationStep("preferences");
  controller.updateOperationValues({
    nickname: "Draft Casey",
    includeBio: true,
    bio: "Recovered bio",
  });
  await controller.saveOperationDraft();

  const restoredController = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
  });
  await restoredController.loadInitial();
  assert.equal(restoredController.store.getState().values.nickname, "Draft Casey");
  assert.equal(restoredController.store.getState().workflow.currentStepKey, "preferences");
  assert.equal(restoredController.store.getState().workflow.draft?.recoveryKey, "@minix/account/operation-form-draft/v1");

  await restoredController.saveOperationDraft();
  await restoredController.saveOperationDraft();
  assert.equal(restoredController.store.getState().submitState.duplicateBlocked, true);
});

test("account controller can route into settings and overview when configured", async () => {
  const { kernel, routeCalls } = createKernelStub();
  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    settingsRouteId: APP_ROUTE_IDS.settings,
    overviewRouteId: APP_ROUTE_IDS.overview,
    identityUpgradeRouteId: APP_ROUTE_IDS.identityUpgrade,
    identityBindPhoneRouteId: APP_ROUTE_IDS.identityBindPhone,
    identityMergeRouteId: APP_ROUTE_IDS.identityMerge,
  });

  await controller.goToSettings();
  await controller.goToOverview();
  await controller.goToIdentityUpgrade();
  await controller.goToPhoneBinding();
  await controller.goToIdentityMerge();

  assert.deepEqual(routeCalls, [
    { routeId: APP_ROUTE_IDS.settings },
    { routeId: APP_ROUTE_IDS.overview },
    { routeId: APP_ROUTE_IDS.identityUpgrade },
    { routeId: APP_ROUTE_IDS.identityBindPhone },
    { routeId: APP_ROUTE_IDS.identityMerge },
  ]);
});

test("account controller surfaces identity workflow actions from the normalized profile response", async () => {
  const { kernel, setUserResponse } = createKernelStub();
  setUserResponse({
    userProfile: {
      nickname: "Guest Casey",
      tags: ["guest", "trial"],
    },
    accountSummary: {
      userId: "guest_1",
      phoneBound: false,
      wechatBound: true,
      realNameStatus: "unverified",
      assets: createAssetSummary({
        points: 0,
        level: 1,
        balanceCents: 0,
        availableBalanceCents: 0,
      }),
      relations: {
        followingCount: 0,
        followerCount: 0,
        friendCount: 0,
        blockedCount: 0,
      },
    },
    userStatus: {
      availability: "guest",
      enabled: false,
      frozen: false,
      cancellationInProgress: false,
      blacklisted: false,
      guest: true,
    },
    identityWorkflows: {
      canUpgradeGuest: true,
      canBindPhone: false,
      mergePending: false,
    },
    securityCenter: createSecurityCenter(),
    accountOperations: [],
    operationRecords: [],
    relationTargets: [],
  });
  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
  });

  await controller.loadInitial();

  assert.equal(controller.store.getState().actions.some((action) => action.key === "upgrade-guest"), true);
});

test("account controller can submit phone binding and refresh account state", async () => {
  const { kernel, postCalls } = createKernelStub();
  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
  });

  await controller.loadInitial();
  await controller.submitPhoneBinding({
    phoneNumber: "13800000022",
    verificationCode: "123456",
  });

  assert.equal(postCalls[0]?.path, "/auth/identity/bind-phone");
  assert.equal(controller.store.getState().transitionFeedback, "The current account is now bound to the verified phone number.");
});

test("account controller can update profile through the shared account endpoint", async () => {
  const { kernel, postCalls, setPostResult } = createKernelStub();
  setPostResult(
    ok({
      userProfile: {
        nickname: "Updated Casey",
        avatarUrl: "https://img.test/avatar.png",
        gender: "unknown",
        region: "Hangzhou, CN",
        bio: "Updated bio",
        tags: ["member-ready"],
      },
      accountSummary: {
        userId: "user-12345",
        phoneBound: true,
        phoneNumberMasked: "138****0001",
        wechatBound: false,
        realNameStatus: "unverified",
        assets: createAssetSummary(),
        relations: {
          followingCount: 12,
          followerCount: 28,
          friendCount: 6,
          blockedCount: 1,
          remarkName: "MiniX User",
        },
      },
      userStatus: {
        availability: "enabled",
        enabled: true,
        frozen: false,
        cancellationInProgress: false,
        blacklisted: false,
        guest: false,
      },
      securityCenter: createSecurityCenter({
        auditEvents: [
          {
            eventId: "security_profile_update",
            scope: "account",
            action: "profile_update",
            result: "allowed",
            message: "Profile update completed.",
            createdAt: "2026-04-10T09:00:00.000Z",
          },
        ],
      }),
      accountOperations: [
        {
          kind: "edit_profile",
          label: "Edit profile",
          available: true,
          statusLabel: "You can update nickname, region, and bio.",
        },
      ],
      operationRecords: [],
      transitionMessage: "Profile updated.",
    }),
  );

  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
  });

  await controller.loadInitial();
  await controller.updateProfile({
    nickname: "Updated Casey",
    region: "Hangzhou, CN",
    bio: "Updated bio",
  });

  assert.equal(postCalls.at(-1)?.path, "/account/profile");
  assert.equal(controller.store.getState().transitionFeedback, "Profile updated.");
});

test("account controller validates conditional cancellation fields through the shared form workflow", async () => {
  const { kernel } = createKernelStub();
  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
  });

  await controller.loadInitial();
  controller.openOperationForm("request_cancellation");
  controller.updateOperationValues({
    verificationCode: "",
    riskConfirmed: false,
    cancellationReason: "other",
    confirmCancellation: false,
  });

  const result = await controller.submitOperationForm();

  assert.equal(result.ok, true);
  assert.equal(controller.store.getState().submitState.phase, "failed");
  assert.equal(controller.store.getState().validationErrors.some((error) => error.field === "verificationCode"), true);
  assert.equal(controller.store.getState().validationErrors.some((error) => error.field === "riskConfirmed"), true);
  assert.equal(controller.store.getState().validationErrors.some((error) => error.field === "cancellationDetails"), true);
  assert.equal(controller.store.getState().validationErrors.some((error) => error.field === "confirmCancellation"), true);
});

test("account controller can submit phone changes through the shared operation form", async () => {
  const { kernel, postCalls } = createKernelStub();
  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
  });

  await controller.loadInitial();
  controller.openOperationForm("change_phone");
  controller.updateOperationValues({
    phoneNumber: "13800000022",
    verificationCode: "123456",
    securityVerificationCode: "654321",
    riskConfirmed: true,
  });
  await controller.submitOperationForm();

  assert.equal(postCalls.at(-1)?.path, "/account/change-phone");
  assert.deepEqual(postCalls.at(-1)?.body, {
    phoneNumber: "13800000022",
    verificationCode: "123456",
    securityVerificationCode: "654321",
    riskConfirmed: true,
  });
  assert.equal(controller.store.getState().operationFormOpen, false);
  assert.equal(controller.store.getState().submitState.phase, "submitted");
});

test("account controller exposes provider sections and can unlink or revoke providers", async () => {
  const { kernel, postCalls } = createKernelStub();
  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
  });

  await controller.loadInitial();
  const providerSection = controller.store.getState().sections.find((section) => section.key === "providers");
  assert.equal(providerSection?.title, "Linked providers");
  assert.equal(providerSection?.items.some((item) => item.label === "WeChat Open Platform"), true);

  await controller.unlinkProvider({
    provider: "wechat-open-platform",
    providerUserId: "provider-user-1",
    verificationCode: "123456",
    riskConfirmed: true,
  });
  assert.equal(postCalls.at(-1)?.path, "/account/provider/unlink");

  await controller.revokeProvider({
    provider: "wechat-open-platform",
    providerUserId: "provider-user-1",
    verificationCode: "654321",
    riskConfirmed: true,
    reason: "security_review",
  });
  assert.equal(postCalls.at(-1)?.path, "/account/provider/revoke");
});

test("account controller can request cancellation and refresh status", async () => {
  const { kernel, postCalls, setPostResult } = createKernelStub();
  setPostResult(
    ok({
      userProfile: {
        nickname: "Casey",
      },
      accountSummary: {
        userId: "user-12345",
        phoneBound: true,
        phoneNumberMasked: "138****0001",
        wechatBound: false,
        realNameStatus: "unverified",
        assets: createAssetSummary({
          points: 980,
          balanceCents: 0,
          availableBalanceCents: 0,
        }),
        relations: {
          followingCount: 12,
          followerCount: 28,
          friendCount: 6,
          blockedCount: 1,
          remarkName: "MiniX User",
        },
      },
      userStatus: {
        availability: "cancellation_pending",
        enabled: false,
        frozen: false,
        cancellationInProgress: true,
        blacklisted: false,
        guest: false,
      },
      securityCenter: createSecurityCenter({
        latestPrompt: {
          title: "Cancellation entered cooling-off review",
          message: "The request can still be revoked before it takes effect.",
          severity: "critical",
          scope: "account",
        },
      }),
      accountOperations: [
        {
          kind: "request_cancellation",
          label: "Request cancellation",
          available: false,
          statusLabel: "Cancellation has already been requested.",
          blockedReason: "Cancellation is already pending for this account.",
        },
        {
          kind: "revoke_cancellation",
          label: "Revoke cancellation",
          available: true,
          statusLabel: "Revocable until 2026-04-18T00:00:00.000Z.",
        },
      ],
      operationRecords: [],
      transitionMessage: "Cancellation request submitted.",
    }),
  );

  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
  });

  await controller.loadInitial();
  await controller.requestCancellation({
    action: "request",
    confirm: true,
    verificationCode: "123456",
    riskConfirmed: true,
    reason: "privacy",
  });

  assert.equal(postCalls.at(-1)?.path, "/account/cancellation");
  assert.deepEqual(postCalls.at(-1)?.body, {
    action: "request",
    confirm: true,
    verificationCode: "123456",
    riskConfirmed: true,
    reason: "privacy",
  });
  assert.equal(controller.store.getState().transitionFeedback, "Cancellation request submitted.");
});

test("account controller can load filtered asset history and expose the ledger section", async () => {
  const { kernel, setAssetHistoryResponse } = createKernelStub();
  setAssetHistoryResponse({
    accountSummary: {
      userId: "user-12345",
      phoneBound: true,
      phoneNumberMasked: "138****0001",
      wechatBound: false,
      realNameStatus: "unverified",
      assets: createAssetSummary({
        balanceCents: 6800,
        availableBalanceCents: 6800,
      }),
      relations: {
        followingCount: 12,
        followerCount: 28,
        friendCount: 6,
        blockedCount: 1,
        remarkName: "MiniX User",
      },
    },
    ledgerEntries: [
      {
        ledgerId: "asset_ledger_membership_1",
        subject: "membership",
        kind: "grant",
        title: "Membership activated",
        message: "Quarterly membership was activated after payment success.",
        createdAt: "2026-04-08T10:00:00.000Z",
        sourceType: "payment",
        sourceId: "ord_reader_1",
        membershipPlanId: "quarterly",
        entitlement: {
          entitlementId: "ent_membership_1",
          key: "membership:quarterly",
          label: "Membership Active",
          status: "active",
          active: true,
          productType: "membership",
          planId: "quarterly",
          sourceOrderId: "ord_reader_1",
        },
      },
    ],
    pagination: {
      page: 1,
      pageSize: 5,
      hasMore: false,
      total: 1,
    },
  });
  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
  });

  await controller.loadInitial();
  const result = await controller.loadAssetHistory({
    page: 1,
    pageSize: 5,
    subject: "membership",
  });

  assert.equal(result.ok, true);
  assert.equal(controller.store.getState().assetLedgerEntries[0]?.subject, "membership");
  assert.equal(controller.store.getState().sections.find((section) => section.key === "asset-ledger")?.items[0]?.label, "Membership activated");
});

test("account controller can load a paginated relation list and keep mutation refresh aligned", async () => {
  const { kernel, postCalls, setPostResult } = createKernelStub();
  setPostResult(
    ok({
      accountSummary: {
        userId: "user-12345",
        phoneBound: true,
        phoneNumberMasked: "138****0001",
        wechatBound: false,
        realNameStatus: "unverified",
        assets: createAssetSummary(),
        relations: {
          followingCount: 3,
          followerCount: 2,
          friendCount: 2,
          blockedCount: 1,
          remarkName: "Coach Lin",
        },
      },
      userStatus: {
        availability: "enabled",
        enabled: true,
        frozen: false,
        cancellationInProgress: false,
        blacklisted: false,
        guest: false,
      },
      relationTargets: [
        {
          targetUserId: "practice_buddy",
          displayName: "Practice Buddy",
          relationshipSummary: "Pending friend request",
          following: true,
          followedBy: false,
          friend: false,
          friendState: "outgoing_request",
          blocked: false,
          remarkName: "Trusted mentor",
          actions: [
            { kind: "unfollow", label: "Unfollow", available: true, active: true },
            { kind: "block", label: "Block", available: true },
            { kind: "set_remark", label: "Update remark", available: true, requiresInput: true, active: true },
            { kind: "clear_remark", label: "Clear remark", available: true, active: true },
          ],
        },
      ],
      relationList: {
        kind: "following",
        items: [
          {
            targetUserId: "practice_buddy",
            displayName: "Practice Buddy",
            relationshipSummary: "Pending friend request",
            following: true,
            followedBy: false,
            friend: false,
            friendState: "outgoing_request",
            blocked: false,
            remarkName: "Trusted mentor",
            actions: [
              { kind: "unfollow", label: "Unfollow", available: true, active: true },
              { kind: "block", label: "Block", available: true },
              { kind: "set_remark", label: "Update remark", available: true, requiresInput: true, active: true },
              { kind: "clear_remark", label: "Clear remark", available: true, active: true },
            ],
            listKind: "following",
          },
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          hasMore: false,
          total: 1,
        },
        keyword: "Practice",
      },
      transitionMessage: "Remark name updated.",
    }),
  );

  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
  });

  await controller.loadInitial();
  await controller.loadRelationList({
    kind: "following",
    page: 1,
    pageSize: 10,
    keyword: "Practice",
  });

  assert.equal(controller.store.getState().relationList?.kind, "following");
  assert.equal(controller.store.getState().relationList?.items[0]?.targetUserId, "practice_buddy");
  assert.equal(controller.store.getState().activeRelationListKind, "following");
  assert.equal(controller.store.getState().relationKeyword, "Practice");

  await controller.applyRelationAction({
    targetUserId: "practice_buddy",
    action: "set_remark",
    remarkName: "Trusted mentor",
  });

  assert.equal(postCalls.at(-1)?.path, "/account/relations");
  assert.deepEqual(postCalls.at(-1)?.body, {
    targetUserId: "practice_buddy",
    action: "set_remark",
    remarkName: "Trusted mentor",
    listKind: "following",
    page: 1,
    pageSize: 10,
    keyword: "Practice",
  });
  assert.equal(controller.store.getState().relationList?.items[0]?.remarkName, "Trusted mentor");
  assert.equal(controller.store.getState().transitionFeedback, "Remark name updated.");
  assert.equal(controller.store.getState().accountSummary?.relations.followingCount, 3);
});

test("account controller can apply relation actions through the shared relation endpoint", async () => {
  const { kernel, postCalls, setPostResult } = createKernelStub();
  setPostResult(
    ok({
      accountSummary: {
        userId: "user-12345",
        phoneBound: true,
        phoneNumberMasked: "138****0001",
        wechatBound: false,
        realNameStatus: "unverified",
        assets: createAssetSummary(),
        relations: {
          followingCount: 11,
          followerCount: 28,
          friendCount: 5,
          blockedCount: 1,
          remarkName: "MiniX User",
        },
      },
      userStatus: {
        availability: "enabled",
        enabled: true,
        frozen: false,
        cancellationInProgress: false,
        blacklisted: false,
        guest: false,
      },
      relationTargets: [
        {
          targetUserId: "creator_sample",
          displayName: "MiniX Mentor",
          relationshipSummary: "Not following",
          following: false,
          followedBy: true,
          friend: false,
          blocked: false,
          remarkName: "MiniX User",
          actions: [
            {
              kind: "follow",
              label: "Follow",
              available: true,
            },
          ],
        },
      ],
      transitionMessage: "Unfollowed relation target.",
    }),
  );

  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
  });

  await controller.loadInitial();
  await controller.applyRelationAction({
    targetUserId: "creator_sample",
    action: "unfollow",
  });

  assert.equal(postCalls.at(-1)?.path, "/account/relations");
  assert.equal(controller.store.getState().transitionFeedback, "Unfollowed relation target.");
  assert.equal(controller.store.getState().accountSummary?.relations.followingCount, 11);
  assert.equal(controller.store.getState().accountSummary?.relations.friendCount, 5);
});
