import test from "node:test";
import assert from "node:assert/strict";

import { ok, type AppKernel, type Result, type UserSession } from "@minix/core";
import { APP_ROUTE_IDS, type CurrentUserResponse } from "@minix/contracts";

import { createAccountController } from "./index";
import { createDefaultAccountState } from "../model";

function createKernelStub() {
  const routeCalls: Array<{ routeId: string; params?: Record<string, string | number | boolean> }> = [];
  const clipboardWrites: string[] = [];
  const storageValues = new Map<string, unknown>();
  let requestMode: "success" | "unauthorized" = "success";
  const postCalls: Array<{ path: string; body: unknown }> = [];
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
      realNameStatus: "unverified",
      assets: {
        points: 1280,
        level: 4,
        membership: {
          active: false,
          tier: "guest",
          entitlementScope: "none",
          statusLabel: "Guest mode",
          renewalLabel: "Upgrade anytime",
          headline: "Guest",
          subheadline: "Guest",
          benefits: [],
        },
        entitlementLabels: ["basic-access"],
        balanceCents: 0,
      },
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
      },
    ],
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
      async get<T>() {
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
              ...(payload.accountOperations ? { accountOperations: payload.accountOperations } : {}),
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
        return ok(capability === "clipboard");
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
      assets: {
        points: 0,
        level: 1,
        membership: {
          active: false,
          tier: "guest",
          entitlementScope: "none",
          statusLabel: "Guest mode",
          renewalLabel: "Upgrade anytime",
          headline: "Guest",
          subheadline: "Guest",
          benefits: [],
        },
        entitlementLabels: ["basic-access"],
        balanceCents: 0,
      },
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
    accountOperations: [],
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
        assets: {
          points: 1280,
          level: 4,
          membership: {
            active: false,
            tier: "guest",
            entitlementScope: "none",
            statusLabel: "Guest mode",
            renewalLabel: "Upgrade anytime",
            headline: "Guest",
            subheadline: "Guest",
            benefits: [],
          },
          entitlementLabels: ["basic-access"],
          balanceCents: 0,
        },
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
      accountOperations: [
        {
          kind: "edit_profile",
          label: "Edit profile",
          available: true,
          statusLabel: "You can update nickname, region, and bio.",
        },
      ],
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
    cancellationReason: "other",
    confirmCancellation: false,
  });

  const result = await controller.submitOperationForm();

  assert.equal(result.ok, true);
  assert.equal(controller.store.getState().submitState.phase, "failed");
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
  });
  await controller.submitOperationForm();

  assert.equal(postCalls.at(-1)?.path, "/account/change-phone");
  assert.equal(controller.store.getState().operationFormOpen, false);
  assert.equal(controller.store.getState().submitState.phase, "submitted");
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
        assets: {
          points: 980,
          level: 4,
          membership: {
            active: false,
            tier: "guest",
            entitlementScope: "none",
            statusLabel: "Guest mode",
            renewalLabel: "Upgrade anytime",
            headline: "Guest",
            subheadline: "Guest",
            benefits: [],
          },
          entitlementLabels: ["basic-access"],
          balanceCents: 0,
        },
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
      accountOperations: [
        {
          kind: "request_cancellation",
          label: "Request cancellation",
          available: false,
          statusLabel: "Cancellation has already been requested.",
          blockedReason: "Cancellation is already pending for this account.",
        },
      ],
      transitionMessage: "Cancellation request submitted.",
    }),
  );

  const controller = createAccountController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
  });

  await controller.loadInitial();
  await controller.requestCancellation();

  assert.equal(postCalls.at(-1)?.path, "/account/cancellation");
  assert.equal(controller.store.getState().transitionFeedback, "Cancellation request submitted.");
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
        assets: {
          points: 1280,
          level: 4,
          membership: {
            active: false,
            tier: "guest",
            entitlementScope: "none",
            statusLabel: "Guest mode",
            renewalLabel: "Upgrade anytime",
            headline: "Guest",
            subheadline: "Guest",
            benefits: [],
          },
          entitlementLabels: ["basic-access"],
          balanceCents: 0,
        },
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
});
