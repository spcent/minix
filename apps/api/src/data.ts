import { createHash } from "node:crypto";

import { APP_ROUTE_IDS, NOTIFICATION_TYPES } from "@minix/contracts";
import type {
  AccountOperationCooldown,
  AccountOperationKind,
  AccountOperationRecord,
  AccountOperation,
  AuthDeviceIdentity,
  AuthProviderIdentity,
  AuthRateLimitState,
  AuthSecurityAuditEvent,
  AuthSecurityPrompt,
  AuthVerificationPurpose,
  BookshelfItem,
  BookshelfResponse,
  ChapterContent,
  ChapterListResponse,
  ChapterSummary,
  ContentAccess,
  ContentActorRole,
  ContentAttachmentReference,
  ContentAuditEntry,
  ContentAuthoringData,
  ContentCard,
  ContentDetail,
  ContentDetailResponse,
  ContentDisplay,
  ContentLifecycleAction,
  ContentLifecycleMutationRequest,
  ContentLifecycleMutationResponse,
  ContentLifecycle,
  ContentPermissions,
  ContentReviewQueue,
  ContentReviewQueueItem,
  ContentReviewQueueResponse,
  ContentReviewRecord,
  GetContentDetailRequest,
  ListContentReviewQueueRequest,
  SaveContentDraftRequest,
  SaveContentDraftResponse,
  CurrentUserResponse,
  AfterSalesCase,
  AfterSalesDetailResponse,
  AfterSalesListResponse,
  FeedbackBootstrapResponse,
  FeedbackCategory,
  FeedbackFaqEntry,
  FeedbackPriority,
  FeedbackRevisitAction,
  FeedbackRevisitRequest,
  FeedbackRevisitResponse,
  FeedbackTicketActionRequest,
  FeedbackTicketActionResponse,
  FeedbackTicketAssignee,
  FeedbackStatus,
  FeedbackSupportEntry,
  FeedbackTicket,
  FeedbackTicketDetailResponse,
  FeedbackTicketList,
  FeedbackTicketSla,
  FeedbackTicketSummary,
  FeedbackType,
  FeedItem,
  FeedListResponse,
  FeedTag,
  ItemsListResponse,
  ListFeedbackTicketsRequest,
  ListFeedbackTicketsResponse,
  ListUserRelationsRequest,
  MarkNotificationsReadResponse,
  MarkThreadReadRequest,
  MessageConsultationProgress,
  MessageBodyItem,
  MessageDeliveryStatus,
  MessageGroupState,
  MessageReplyPolicy,
  MessageSupportProgress,
  MessageThreadActions,
  MessageThreadList,
  MessageThreadListResponse,
  MessageThreadListSort,
  MessageThreadMember,
  MessageThreadMemberRole,
  MessageThread,
  MessageThreadResponse,
  MessageTouchpoint,
  MessageTouchpointChannel,
  MessageTouchpointProviderMode,
  MessageTouchpointReceipt,
  MessageTouchpointReceiptStatus,
  RetryMessageRequest,
  RetryMessageResponse,
  SyncMessageThreadRequest,
  MembershipOverview,
  MembershipEntitlement,
  NovelCard,
  NovelDetail,
  NovelListResponse,
  NotificationFilterGroup,
  NotificationGroupSummary,
  NotificationItem,
  NotificationList,
  NotificationListResponse,
  NotificationType,
  OrderList,
  OrderListResponse,
  Order,
  OrderDetailResponse,
  OrderSummary,
  ListOrdersRequest,
  PaymentCatalogResponse,
  PaymentCallbackVerification,
  PaymentChannel,
  PaymentGatewayExecutionRequest,
  PaymentGatewayExecutionResponse,
  PaymentGatewayProvider,
  PaymentIntent,
  PaymentLedgerEntry,
  PaymentOperationResult,
  PaymentProduct,
  PaymentProviderMode,
  PaymentReconciliation,
  PaymentReconciliationLedgerEntry,
  PaymentResult,
  PaymentSku,
  ProductBillingCycle,
  ProductType,
  PurchaseOrderRequest,
  PurchaseOrderResponse,
  PurchaseMembershipRequest,
  PurchaseMembershipResponse,
  RelatedNovelSummary,
  SecurityCenter,
  SearchDomain,
  SearchFilterGroup,
  SearchResults,
  SearchSortOption,
  ShareAttributionReport,
  ShareAttributionReportResponse,
  SharePrepareRequest,
  SharePrepareResponse,
  ShareShortLinkResolveResponse,
  ShareReturnRecognitionRequest,
  ShareReturnRecognitionResponse,
  SubscriptionListResponse,
  SubscriptionOperationRequest,
  SubscriptionRecord,
  SubscriptionStatus,
  CreateMessageThreadRequest,
  CreateMessageThreadResponse,
  GetMessageThreadRequest,
  ListUserAssetHistoryRequest,
  SendMessageRequest,
  SendMessageResponse,
  SettingsEffectivePolicy,
  SettingsFeatureToggles,
  SettingsNotificationChannel,
  SettingsNotificationChannelPreference,
  SettingsPreferences,
  SettingsPrivacyOptions,
  SettingsProfileVisibility,
  SettingsResponse,
  SubmitFeedbackRequest,
  SubmitFeedbackResponse,
  UserAssetHistoryResponse,
  UserAssetSummary,
  UserAssetLedgerEntry,
  UserAvailabilityStatus,
  UserEntitlement,
  UserRelationAction,
  UserRelationList,
  UserRelationListItem,
  UserRelationListKind,
  UserRelationTarget,
  UserFriendState,
  UnreadBadge,
  UploadAsset,
  UploadAttachRequest,
  UploadCancelRequest,
  UploadChunkReceipt,
  UploadChunkRequest,
  UploadCleanupRecord,
  UploadError,
  UploadPipelineSource,
  UploadPipelineRequest,
  UploadPipelineResponse,
  UploadProgress,
  UploadReference,
  UploadReviewRecord,
  UploadRetryRequest,
  UploadReviewStatus,
  UploadScenario,
  UploadSelectionResult,
  UploadSession,
  UploadSessionRequest,
  UploadTask,
  UploadTransferPayload,
} from "@minix/contracts";
import type { OperationalDomainKey, OperationalState } from "./types";

import {
  CHAPTER_CONTENT,
  CHAPTER_LISTS,
  DEFAULT_BOOKSHELF_NOVEL_IDS,
  DEFAULT_MEMBERSHIP_OVERVIEW,
  DEFAULT_PROGRESS_BY_NOVEL_ID,
  HOST_ITEMS,
  MEMBER_RENEWAL_LABELS,
  NOVELS,
} from "./content";
import { resolveSampleMediaUrl } from "./sample-assets";
import type {
  SessionRecord,
  StoredMessageThreadRecord,
  StoredNotificationTouchpointRecord,
  StoredUploadRecord,
  UserState,
} from "./types";

export { CHAPTER_CONTENT, CHAPTER_LISTS, DEFAULT_MEMBERSHIP_OVERVIEW, NOVELS } from "./content";

const ACCOUNT_OPERATION_COOLDOWN_MS = 10 * 60 * 1000;
const ACCOUNT_CANCELLATION_COOLING_OFF_MS = 7 * 24 * 60 * 60 * 1000;
const OPERATIONAL_STATE_SCHEMA_VERSION = 1;
const DEFAULT_UPLOAD_CHUNK_SIZE_BYTES = 64 * 1024;
const REDUCED_UPLOAD_CHUNK_SIZE_BYTES = 16 * 1024;
const WEAK_NETWORK_UPLOAD_CHUNK_SIZE_BYTES = 8 * 1024;

function createDefaultSettingsPreferences(deployEnv: string | undefined): SettingsPreferences {
  return {
    language: "zh-CN",
    theme: "system",
    fontScale: "md",
    notificationsEnabled: true,
    device: {
      cacheLabel: "Clear local cache only",
      networkStrategy: "balanced",
      autoplay: true,
      weakNetworkMode: false,
    },
    account: {
      profileEntryLabel: "Edit profile",
      phoneEntryLabel: "Edit phone",
      unbindEntryLabel: "Manage WeChat binding",
      providerEntryLabel: "Linked providers",
      cancellationEntryLabel: "Cancellation entry",
    },
    content: {
      sortOrder: "recommended",
      filterMode: "all",
      readingMode: "scroll",
      historyEnabled: true,
    },
    developerOptions: {
      logsEnabled: deployEnv !== "production",
      experimentsEnabled: deployEnv !== "production",
    },
  };
}

function createDefaultSettingsFeatureToggles(deployEnv: string | undefined): SettingsFeatureToggles {
  return {
    pushEnabled: true,
    smsEnabled: false,
    emailEnabled: false,
    accountCenterEnabled: true,
    readingSyncEnabled: true,
    experimentsEnabled: deployEnv !== "production",
  };
}

function createDefaultSettingsPrivacyOptions(): SettingsPrivacyOptions {
  return {
    profileVisibility: "signed_in_only",
    profileVisibilityLabel: "Visible inside signed-in surfaces only",
    personalizedRecommendations: true,
    searchHistoryEnabled: true,
    analyticsEnabled: true,
    screenshotFeedbackEnabled: true,
  };
}

function createOperationalDomainSchema(domain: OperationalDomainKey): OperationalState["domainSchemas"][number] {
  return {
    domain,
    schemaVersion: 1,
    recordCount: 0,
  };
}

export function createDefaultOperationalState(): OperationalState {
  const appliedAt = "2026-04-11T00:00:00.000Z";
  return {
    schemaVersion: OPERATIONAL_STATE_SCHEMA_VERSION,
    domainSchemas: [
      createOperationalDomainSchema("sessions"),
      createOperationalDomainSchema("credentials"),
      createOperationalDomainSchema("orders"),
      createOperationalDomainSchema("uploads"),
      createOperationalDomainSchema("messages"),
      createOperationalDomainSchema("content"),
      createOperationalDomainSchema("feedback"),
      createOperationalDomainSchema("audit_events"),
    ],
    migrations: [
      {
        migrationId: "ops_state_v1",
        target: "operational_state",
        fromVersion: 0,
        toVersion: OPERATIONAL_STATE_SCHEMA_VERSION,
        status: "completed",
        appliedAt,
        note: "Initial operational state baseline for durable governance metadata and background jobs.",
      },
    ],
    backgroundJobs: [],
    monitoringEvents: [],
    auditTrail: [],
  };
}

function createProfileVisibilityLabel(visibility: SettingsProfileVisibility): string {
  if (visibility === "public") {
    return "Public inside discovery and relation surfaces";
  }

  if (visibility === "followers_only") {
    return "Visible to mutual and follower-driven discovery";
  }

  return "Visible inside signed-in surfaces only";
}

const NOTIFICATION_CHANNEL_PROVIDER_CONFIG: Record<
  SettingsNotificationChannel,
  {
    providerKey: string;
    providerLabel: string;
    locale: string;
    fallbackToInApp: boolean;
    defaultEnabled: boolean;
  }
> = {
  subscription_message: {
    providerKey: "wechat_subscription_sample",
    providerLabel: "WeChat Subscription Provider",
    locale: "zh-CN",
    fallbackToInApp: true,
    defaultEnabled: true,
  },
  sms: {
    providerKey: "sms_sample",
    providerLabel: "Sample SMS Provider",
    locale: "zh-CN",
    fallbackToInApp: true,
    defaultEnabled: false,
  },
  email: {
    providerKey: "email_sample",
    providerLabel: "Sample Email Provider",
    locale: "zh-CN",
    fallbackToInApp: true,
    defaultEnabled: false,
  },
  push: {
    providerKey: "push_sample",
    providerLabel: "Sample Push Provider",
    locale: "zh-CN",
    fallbackToInApp: true,
    defaultEnabled: true,
  },
};

function resolveSettingsState(userState: UserState, deployEnv: string | undefined): {
  preferences: SettingsPreferences;
  featureToggles: SettingsFeatureToggles;
  privacyOptions: SettingsPrivacyOptions;
  effectivePolicy: SettingsEffectivePolicy;
  notificationChannels: SettingsNotificationChannelPreference[];
  lockedSettingKeys: string[];
} {
  const defaultPreferences = createDefaultSettingsPreferences(deployEnv);
  const defaultFeatureToggles = createDefaultSettingsFeatureToggles(deployEnv);
  const defaultPrivacyOptions = createDefaultSettingsPrivacyOptions();
  const preferences: SettingsPreferences = {
    ...defaultPreferences,
    ...(userState.settingsState?.preferences ?? {}),
    device: {
      ...defaultPreferences.device,
      ...(userState.settingsState?.preferences?.device ?? {}),
    },
    account: defaultPreferences.account,
    content: defaultPreferences.content,
    developerOptions: {
      ...defaultPreferences.developerOptions,
      ...(userState.settingsState?.preferences?.developerOptions ?? {}),
    },
  };
  const featureToggles: SettingsFeatureToggles = {
    ...defaultFeatureToggles,
    ...(userState.settingsState?.featureToggles ?? {}),
  };
  const privacyOptions: SettingsPrivacyOptions = {
    ...defaultPrivacyOptions,
    ...(userState.settingsState?.privacyOptions ?? {}),
    profileVisibility:
      userState.settingsState?.privacyOptions?.profileVisibility ?? defaultPrivacyOptions.profileVisibility,
    profileVisibilityLabel: createProfileVisibilityLabel(
      userState.settingsState?.privacyOptions?.profileVisibility ?? defaultPrivacyOptions.profileVisibility,
    ),
  };

  const lockedSettingKeys: string[] = [];
  if (deployEnv === "production") {
    preferences.developerOptions.logsEnabled = false;
    preferences.developerOptions.experimentsEnabled = false;
    featureToggles.experimentsEnabled = false;
    lockedSettingKeys.push(
      "preferences.developerOptions.logsEnabled",
      "preferences.developerOptions.experimentsEnabled",
      "featureToggles.experimentsEnabled",
    );
  } else {
    featureToggles.experimentsEnabled = preferences.developerOptions.experimentsEnabled;
  }

  const storedNotificationChannels = userState.settingsState?.notificationChannels ?? {};
  const notificationChannels = (Object.keys(NOTIFICATION_CHANNEL_PROVIDER_CONFIG) as SettingsNotificationChannel[]).map((channel) => {
    const providerConfig = NOTIFICATION_CHANNEL_PROVIDER_CONFIG[channel];
    const stored = storedNotificationChannels[channel];
    const toggleEnabled =
      channel === "subscription_message"
        ? true
        : channel === "push"
          ? featureToggles.pushEnabled
          : channel === "sms"
            ? featureToggles.smsEnabled
            : featureToggles.emailEnabled;
    const enabled = preferences.notificationsEnabled && toggleEnabled && (stored?.enabled ?? providerConfig.defaultEnabled);
    const unsubscribed = Boolean(stored?.unsubscribed);
    const statusLabel = !preferences.notificationsEnabled
      ? "All notification delivery is disabled."
      : !toggleEnabled
        ? `${channel.replace("_", " ")} delivery is disabled by the current account policy.`
        : unsubscribed
          ? `Unsubscribed from ${channel.replace("_", " ")} delivery.`
          : enabled
            ? `${providerConfig.providerLabel} is active for ${channel.replace("_", " ")} delivery.`
            : `${channel.replace("_", " ")} delivery is paused by user preference.`;
    return {
      channel,
      enabled,
      unsubscribed,
      providerKey: providerConfig.providerKey,
      providerLabel: providerConfig.providerLabel,
      locale: providerConfig.locale,
      fallbackToInApp: providerConfig.fallbackToInApp,
      statusLabel,
      unsubscribable: channel !== "push",
      ...(stored?.unsubscribedAt ? { unsubscribedAt: stored.unsubscribedAt } : {}),
    };
  });

  const eligibleChannels: SettingsEffectivePolicy["notification"]["eligibleChannels"] = [];
  if (preferences.notificationsEnabled) {
    eligibleChannels.push("in_app", "subscription_message");
    if (notificationChannels.find((item) => item.channel === "push")?.enabled) {
      eligibleChannels.push("push");
    }
    if (notificationChannels.find((item) => item.channel === "sms")?.enabled) {
      eligibleChannels.push("sms");
    }
    if (notificationChannels.find((item) => item.channel === "email")?.enabled) {
      eligibleChannels.push("email");
    }
  }

  const uploadChunkSizeBytes = preferences.device.weakNetworkMode
    ? WEAK_NETWORK_UPLOAD_CHUNK_SIZE_BYTES
    : preferences.device.networkStrategy === "data-saver"
      ? REDUCED_UPLOAD_CHUNK_SIZE_BYTES
      : DEFAULT_UPLOAD_CHUNK_SIZE_BYTES;

  return {
    preferences,
    featureToggles,
    privacyOptions,
    effectivePolicy: {
      notification: {
        inAppEnabled: preferences.notificationsEnabled,
        subscriptionMessageEnabled: Boolean(notificationChannels.find((item) => item.channel === "subscription_message")?.enabled),
        pushEnabled: Boolean(notificationChannels.find((item) => item.channel === "push")?.enabled),
        smsEnabled: Boolean(notificationChannels.find((item) => item.channel === "sms")?.enabled),
        emailEnabled: Boolean(notificationChannels.find((item) => item.channel === "email")?.enabled),
        eligibleChannels,
        stationFallbackEnabled: true,
      },
      privacy: {
        profileVisibility: privacyOptions.profileVisibility,
        profileSearchVisible: privacyOptions.profileVisibility !== "signed_in_only",
        relationSearchVisible: privacyOptions.profileVisibility !== "signed_in_only",
        personalizedRankingEnabled: privacyOptions.personalizedRecommendations,
        analyticsCollectionEnabled: privacyOptions.analyticsEnabled,
      },
      device: {
        autoplayEnabled: preferences.device.autoplay && !preferences.device.weakNetworkMode,
        weakNetworkMode: preferences.device.weakNetworkMode,
        networkStrategy: preferences.device.networkStrategy,
        uploadChunkSizeBytes,
        diagnosticsEnabled: preferences.developerOptions.logsEnabled && deployEnv !== "production",
      },
      developer: {
        environment: deployEnv === "production" ? "production" : "debug",
        logsEditable: deployEnv !== "production",
        experimentsEditable: deployEnv !== "production",
        logsEnabled: preferences.developerOptions.logsEnabled,
        experimentsEnabled: featureToggles.experimentsEnabled,
        ...(deployEnv === "production"
          ? { lockedReason: "Developer diagnostics are locked in production." }
          : {}),
      },
    },
    notificationChannels,
    lockedSettingKeys,
  };
}

export function applySettingsUpdate(
  userState: UserState,
  update: {
    preferences?: {
      notificationsEnabled?: boolean;
      device?: Partial<Pick<SettingsPreferences["device"], "networkStrategy" | "autoplay" | "weakNetworkMode">>;
      developerOptions?: Partial<SettingsPreferences["developerOptions"]>;
    };
    featureToggles?: Partial<Pick<SettingsFeatureToggles, "pushEnabled" | "smsEnabled" | "emailEnabled">>;
    notificationChannels?: Array<{
      channel: SettingsNotificationChannel;
      enabled?: boolean;
      unsubscribed?: boolean;
    }>;
    privacyOptions?: Partial<Pick<SettingsPrivacyOptions, "profileVisibility" | "personalizedRecommendations" | "searchHistoryEnabled" | "analyticsEnabled" | "screenshotFeedbackEnabled">>;
  },
  deployEnv: string | undefined,
) {
  const current = resolveSettingsState(userState, deployEnv);
  const nextPreferences: NonNullable<UserState["settingsState"]>["preferences"] = {
    notificationsEnabled: update.preferences?.notificationsEnabled ?? current.preferences.notificationsEnabled,
    device: {
      networkStrategy: update.preferences?.device?.networkStrategy ?? current.preferences.device.networkStrategy,
      autoplay: update.preferences?.device?.autoplay ?? current.preferences.device.autoplay,
      weakNetworkMode: update.preferences?.device?.weakNetworkMode ?? current.preferences.device.weakNetworkMode,
    },
    developerOptions: {
      logsEnabled:
        deployEnv === "production"
          ? false
          : update.preferences?.developerOptions?.logsEnabled ?? current.preferences.developerOptions.logsEnabled,
      experimentsEnabled:
        deployEnv === "production"
          ? false
          : update.preferences?.developerOptions?.experimentsEnabled ?? current.preferences.developerOptions.experimentsEnabled,
    },
  };
  const nextFeatureToggles: NonNullable<UserState["settingsState"]>["featureToggles"] = {
    pushEnabled: update.featureToggles?.pushEnabled ?? current.featureToggles.pushEnabled,
    smsEnabled: update.featureToggles?.smsEnabled ?? current.featureToggles.smsEnabled,
    emailEnabled: update.featureToggles?.emailEnabled ?? current.featureToggles.emailEnabled,
  };
  const nextNotificationChannels: NonNullable<UserState["settingsState"]>["notificationChannels"] = {
    ...(userState.settingsState?.notificationChannels ?? {}),
  };
  for (const channelUpdate of update.notificationChannels ?? []) {
    const currentChannel = nextNotificationChannels[channelUpdate.channel] ?? {};
    nextNotificationChannels[channelUpdate.channel] = {
      ...currentChannel,
      ...(channelUpdate.enabled !== undefined ? { enabled: channelUpdate.enabled } : {}),
      ...(channelUpdate.unsubscribed !== undefined ? { unsubscribed: channelUpdate.unsubscribed } : {}),
      ...(channelUpdate.unsubscribed !== undefined
        ? (channelUpdate.unsubscribed ? { unsubscribedAt: new Date().toISOString() } : {})
        : {}),
    };
  }
  const nextPrivacyOptions: NonNullable<UserState["settingsState"]>["privacyOptions"] = {
    profileVisibility: update.privacyOptions?.profileVisibility ?? current.privacyOptions.profileVisibility,
    personalizedRecommendations:
      update.privacyOptions?.personalizedRecommendations ?? current.privacyOptions.personalizedRecommendations,
    searchHistoryEnabled: update.privacyOptions?.searchHistoryEnabled ?? current.privacyOptions.searchHistoryEnabled,
    analyticsEnabled: update.privacyOptions?.analyticsEnabled ?? current.privacyOptions.analyticsEnabled,
    screenshotFeedbackEnabled:
      update.privacyOptions?.screenshotFeedbackEnabled ?? current.privacyOptions.screenshotFeedbackEnabled,
  };

  userState.settingsState = {
    preferences: nextPreferences,
    featureToggles: nextFeatureToggles,
    notificationChannels: nextNotificationChannels,
    privacyOptions: nextPrivacyOptions,
  };

  return resolveSettingsState(userState, deployEnv);
}

function resolveMaskedPhoneNumber(phoneNumber: string | undefined): string | undefined {
  if (!phoneNumber) {
    return undefined;
  }

  const normalized = phoneNumber.replace(/[^\d]/g, "");
  if (normalized.length < 7) {
    return undefined;
  }

  return `${normalized.slice(0, 3)}****${normalized.slice(-4)}`;
}

export function createAssetLedgerEntry(
  input: Omit<UserAssetLedgerEntry, "ledgerId"> & { ledgerId?: string },
): UserAssetLedgerEntry {
  return {
    ledgerId: input.ledgerId ?? `asset_ledger_${crypto.randomUUID()}`,
    subject: input.subject,
    kind: input.kind,
    title: input.title,
    message: input.message,
    createdAt: input.createdAt,
    sourceType: input.sourceType,
    ...(input.sourceId ? { sourceId: input.sourceId } : {}),
    ...(input.pointsDelta !== undefined ? { pointsDelta: input.pointsDelta } : {}),
    ...(input.levelDelta !== undefined ? { levelDelta: input.levelDelta } : {}),
    ...(input.balanceDeltaCents !== undefined ? { balanceDeltaCents: input.balanceDeltaCents } : {}),
    ...(input.frozenBalanceDeltaCents !== undefined ? { frozenBalanceDeltaCents: input.frozenBalanceDeltaCents } : {}),
    ...(input.membershipPlanId ? { membershipPlanId: input.membershipPlanId } : {}),
    ...(input.entitlement ? { entitlement: input.entitlement } : {}),
  };
}

export function appendUserAssetLedgerEntry(userState: UserState, entry: UserAssetLedgerEntry): UserAssetLedgerEntry {
  userState.assetLedgerEntries = [...(userState.assetLedgerEntries ?? []), entry];
  return entry;
}

function deriveUserEntitlements(entries: UserAssetLedgerEntry[]): UserEntitlement[] {
  const entitlementsById = new Map<string, UserEntitlement>();

  for (const entry of entries) {
    if (!entry.entitlement) {
      continue;
    }

    const existing = entitlementsById.get(entry.entitlement.entitlementId);
    entitlementsById.set(entry.entitlement.entitlementId, {
      ...(existing ?? entry.entitlement),
      ...entry.entitlement,
    });
  }

  return Array.from(entitlementsById.values()).sort((left, right) => right.entitlementId.localeCompare(left.entitlementId));
}

function deriveMembershipPlanFromLedger(entries: UserAssetLedgerEntry[]): PurchaseMembershipRequest["planId"] | undefined {
  const activeMembership = entries
    .filter((entry) => entry.subject === "membership" && entry.membershipPlanId)
    .at(-1);

  return activeMembership?.membershipPlanId;
}

function deriveUserAssetSummary(userState: UserState): {
  summary: UserAssetSummary;
  membershipPlanId?: PurchaseMembershipRequest["planId"];
  activeEntitlements: UserEntitlement[];
} {
  const assetLedgerEntries = userState.assetLedgerEntries ?? [];
  let points = 0;
  let level = 1;
  let balanceCents = 0;
  let frozenBalanceCents = 0;

  for (const entry of assetLedgerEntries) {
    points += entry.pointsDelta ?? 0;
    level += entry.levelDelta ?? 0;
    balanceCents += entry.balanceDeltaCents ?? 0;
    frozenBalanceCents += entry.frozenBalanceDeltaCents ?? 0;
  }

  const activeEntitlements = deriveUserEntitlements(assetLedgerEntries).filter((entitlement) => entitlement.active);
  const membershipPlanId = userState.membershipPlanId ?? deriveMembershipPlanFromLedger(assetLedgerEntries);
  const membership = createMembershipOverview(membershipPlanId);
  const summary: UserAssetSummary = {
    points: Math.max(0, points),
    level: Math.max(1, level),
    membership,
    entitlementLabels: activeEntitlements.length > 0 ? activeEntitlements.map((entitlement) => entitlement.label) : ["basic-access"],
    balanceCents,
    availableBalanceCents: balanceCents - frozenBalanceCents,
    frozenBalanceCents,
    activeEntitlements,
  };

  return {
    summary,
    ...(membershipPlanId ? { membershipPlanId } : {}),
    activeEntitlements,
  };
}

function createManagedContentAuditEntry(input: {
  auditId: string;
  action: ContentAuditEntry["action"];
  actorRole: ContentActorRole;
  actorLabel: string;
  createdAt: string;
  message: string;
}): ContentAuditEntry {
  return {
    auditId: input.auditId,
    action: input.action,
    actorRole: input.actorRole,
    actorLabel: input.actorLabel,
    createdAt: input.createdAt,
    message: input.message,
  };
}

function createManagedContentAttachments(contentId: string, attachmentAssetIds: string[]): ContentAttachmentReference[] {
  return attachmentAssetIds.map((assetId, index) => ({
    assetId,
    kind: "attachment",
    label: `${contentId} attachment ${index + 1}`,
  }));
}

function createDefaultManagedContentEntries(): NonNullable<UserState["managedContentById"]> {
  return {
    lesson_1: {
      authorUserId: "editorial_author_1",
      model: "article",
      visibility: "public",
      lifecycle: {
        state: "published",
        availableActions: ["update", "archive", "delete", "change_visibility"],
        publishedAt: "2026-04-01T08:00:00.000Z",
        updatedAt: "2026-04-01T08:00:00.000Z",
      },
      authorLabel: "MiniX Editorial",
      title: HOST_ITEMS[0]?.title ?? "Warm-up lesson",
      ...(HOST_ITEMS[0]?.subtitle ? { subtitle: HOST_ITEMS[0].subtitle } : {}),
      summary: HOST_ITEMS[0]?.subtitle ?? "Warm-up content block.",
      bodyPreview: "Published warm-up lesson body preview.",
      categoryKey: "warm-up",
      categoryLabel: "Warm-up",
      tags: [{ key: "article", label: "Article" }],
      attachments: [],
      reviewRecord: {
        reviewId: "review_lesson_1",
        status: "approved",
        queueLabel: "Editorial review",
        reviewerLabel: "Reviewer Mina",
        submittedAt: "2026-03-31T08:00:00.000Z",
        assignedAt: "2026-03-31T08:10:00.000Z",
        decidedAt: "2026-04-01T08:00:00.000Z",
        message: "Approved for publication.",
      },
      auditHistory: [
        createManagedContentAuditEntry({
          auditId: "audit_lesson_1_create",
          action: "create",
          actorRole: "author",
          actorLabel: "MiniX Editorial",
          createdAt: "2026-03-31T07:30:00.000Z",
          message: "Initial article draft created.",
        }),
        createManagedContentAuditEntry({
          auditId: "audit_lesson_1_publish",
          action: "publish",
          actorRole: "reviewer",
          actorLabel: "Reviewer Mina",
          createdAt: "2026-04-01T08:00:00.000Z",
          message: "Article approved and published.",
        }),
      ],
      actorRoles: ["author", "reviewer", "admin", "reader"],
      authoring: {
        title: HOST_ITEMS[0]?.title ?? "Warm-up lesson",
        ...(HOST_ITEMS[0]?.subtitle ? { subtitle: HOST_ITEMS[0].subtitle } : {}),
        summary: HOST_ITEMS[0]?.subtitle ?? "Warm-up content block.",
        bodyPreview: "Published warm-up lesson body preview.",
        visibility: "public",
        category: { key: "warm-up", label: "Warm-up" },
        tags: [{ key: "article", label: "Article" }],
        attachmentAssetIds: [],
      },
    },
    lesson_2: {
      authorUserId: "minix_user",
      model: "course",
      visibility: "login_required",
      lifecycle: {
        state: "draft",
        availableActions: ["publish", "submit_review", "delete", "change_visibility"],
        updatedAt: "2026-04-02T08:00:00.000Z",
      },
      authorLabel: "MiniX Curriculum",
      title: HOST_ITEMS[1]?.title ?? "Dialogue practice",
      ...(HOST_ITEMS[1]?.subtitle ? { subtitle: HOST_ITEMS[1].subtitle } : {}),
      summary: HOST_ITEMS[1]?.subtitle ?? "Dialogue content block.",
      bodyPreview: "Draft lesson body preview for dialogue practice.",
      categoryKey: "input",
      categoryLabel: "Input",
      tags: [{ key: "course", label: "Course" }],
      attachments: [],
      reviewRecord: {
        reviewId: "review_lesson_2",
        status: "not_requested",
        queueLabel: "Draft workspace",
      },
      auditHistory: [
        createManagedContentAuditEntry({
          auditId: "audit_lesson_2_create",
          action: "create",
          actorRole: "author",
          actorLabel: "MiniX Curriculum",
          createdAt: "2026-04-02T08:00:00.000Z",
          message: "Course draft created in the CMS workspace.",
        }),
      ],
      actorRoles: ["author", "reviewer", "admin", "reader"],
      authoring: {
        title: HOST_ITEMS[1]?.title ?? "Dialogue practice",
        ...(HOST_ITEMS[1]?.subtitle ? { subtitle: HOST_ITEMS[1].subtitle } : {}),
        summary: HOST_ITEMS[1]?.subtitle ?? "Dialogue content block.",
        bodyPreview: "Draft lesson body preview for dialogue practice.",
        visibility: "login_required",
        category: { key: "input", label: "Input" },
        tags: [{ key: "course", label: "Course" }],
        attachmentAssetIds: [],
      },
    },
    lesson_3: {
      authorUserId: "practice_author_1",
      model: "post",
      visibility: "member_only",
      lifecycle: {
        state: "under_review",
        availableActions: ["approve_review", "reject_review", "change_visibility"],
        updatedAt: "2026-04-03T08:00:00.000Z",
        reviewMessage: "Waiting for review approval before publishing.",
      },
      authorLabel: "MiniX Review Queue",
      title: HOST_ITEMS[2]?.title ?? "Practice post",
      ...(HOST_ITEMS[2]?.subtitle ? { subtitle: HOST_ITEMS[2].subtitle } : {}),
      summary: HOST_ITEMS[2]?.subtitle ?? "Practice content block.",
      bodyPreview: "Practice post body preview pending review.",
      categoryKey: "practice",
      categoryLabel: "Practice",
      tags: [{ key: "review", label: "Review" }],
      attachments: [],
      reviewRecord: {
        reviewId: "review_lesson_3",
        status: "queued",
        queueLabel: "Review queue",
        reviewerLabel: "Reviewer Mina",
        submittedAt: "2026-04-03T08:00:00.000Z",
        assignedAt: "2026-04-03T08:10:00.000Z",
        message: "Waiting for review approval before publishing.",
      },
      auditHistory: [
        createManagedContentAuditEntry({
          auditId: "audit_lesson_3_create",
          action: "create",
          actorRole: "author",
          actorLabel: "MiniX Review Queue",
          createdAt: "2026-04-03T07:30:00.000Z",
          message: "Post draft created for review.",
        }),
        createManagedContentAuditEntry({
          auditId: "audit_lesson_3_submit",
          action: "submit_review",
          actorRole: "author",
          actorLabel: "MiniX Review Queue",
          createdAt: "2026-04-03T08:00:00.000Z",
          message: "Post submitted into the review queue.",
        }),
      ],
      actorRoles: ["author", "reviewer", "admin", "reader"],
      authoring: {
        title: HOST_ITEMS[2]?.title ?? "Practice post",
        ...(HOST_ITEMS[2]?.subtitle ? { subtitle: HOST_ITEMS[2].subtitle } : {}),
        summary: HOST_ITEMS[2]?.subtitle ?? "Practice content block.",
        bodyPreview: "Practice post body preview pending review.",
        visibility: "member_only",
        category: { key: "practice", label: "Practice" },
        tags: [{ key: "review", label: "Review" }],
        attachmentAssetIds: [],
      },
    },
    lesson_4: {
      authorUserId: "coaching_author_1",
      model: "consultation_service",
      visibility: "purchased_only",
      lifecycle: {
        state: "review_rejected",
        availableActions: ["update", "submit_review", "delete", "change_visibility"],
        updatedAt: "2026-04-04T08:00:00.000Z",
        reviewMessage: "Needs a clearer service scope before approval.",
      },
      authorLabel: "MiniX Coaching",
      title: HOST_ITEMS[3]?.title ?? "Speaking clinic",
      ...(HOST_ITEMS[3]?.subtitle ? { subtitle: HOST_ITEMS[3].subtitle } : {}),
      summary: HOST_ITEMS[3]?.subtitle ?? "Speaking content block.",
      bodyPreview: "Rejected consultation service draft preview.",
      categoryKey: "speaking",
      categoryLabel: "Speaking",
      tags: [{ key: "service", label: "Service" }],
      attachments: [],
      reviewRecord: {
        reviewId: "review_lesson_4",
        status: "rejected",
        queueLabel: "Reviewer feedback",
        reviewerLabel: "Reviewer Mina",
        submittedAt: "2026-04-04T07:40:00.000Z",
        assignedAt: "2026-04-04T07:50:00.000Z",
        decidedAt: "2026-04-04T08:00:00.000Z",
        message: "Needs a clearer service scope before approval.",
      },
      auditHistory: [
        createManagedContentAuditEntry({
          auditId: "audit_lesson_4_create",
          action: "create",
          actorRole: "author",
          actorLabel: "MiniX Coaching",
          createdAt: "2026-04-04T07:20:00.000Z",
          message: "Consultation service draft created.",
        }),
        createManagedContentAuditEntry({
          auditId: "audit_lesson_4_reject",
          action: "reject_review",
          actorRole: "reviewer",
          actorLabel: "Reviewer Mina",
          createdAt: "2026-04-04T08:00:00.000Z",
          message: "Review rejected with scope clarification feedback.",
        }),
      ],
      actorRoles: ["author", "reviewer", "admin", "reader"],
      authoring: {
        title: HOST_ITEMS[3]?.title ?? "Speaking clinic",
        ...(HOST_ITEMS[3]?.subtitle ? { subtitle: HOST_ITEMS[3].subtitle } : {}),
        summary: HOST_ITEMS[3]?.subtitle ?? "Speaking content block.",
        bodyPreview: "Rejected consultation service draft preview.",
        visibility: "purchased_only",
        category: { key: "speaking", label: "Speaking" },
        tags: [{ key: "service", label: "Service" }],
        attachmentAssetIds: [],
      },
    },
    lesson_5: {
      authorUserId: "ops_author_1",
      model: "tool_config",
      visibility: "public",
      lifecycle: {
        state: "offline",
        availableActions: ["restore", "delete", "change_visibility"],
        updatedAt: "2026-04-05T08:00:00.000Z",
        offlineAt: "2026-04-05T08:00:00.000Z",
      },
      authorLabel: "MiniX Operations",
      title: HOST_ITEMS[4]?.title ?? "Tooling config",
      ...(HOST_ITEMS[4]?.subtitle ? { subtitle: HOST_ITEMS[4].subtitle } : {}),
      summary: HOST_ITEMS[4]?.subtitle ?? "Review content block.",
      bodyPreview: "Offline tooling config preview.",
      categoryKey: "wrap-up",
      categoryLabel: "Wrap-up",
      tags: [{ key: "tool", label: "Tool" }],
      attachments: [],
      reviewRecord: {
        reviewId: "review_lesson_5",
        status: "approved",
        queueLabel: "Ops review",
        reviewerLabel: "Reviewer Mina",
        submittedAt: "2026-04-04T08:00:00.000Z",
        assignedAt: "2026-04-04T08:10:00.000Z",
        decidedAt: "2026-04-04T08:30:00.000Z",
        message: "Approved before taking offline for maintenance.",
      },
      auditHistory: [
        createManagedContentAuditEntry({
          auditId: "audit_lesson_5_publish",
          action: "publish",
          actorRole: "reviewer",
          actorLabel: "Reviewer Mina",
          createdAt: "2026-04-04T08:30:00.000Z",
          message: "Tool config published.",
        }),
        createManagedContentAuditEntry({
          auditId: "audit_lesson_5_archive",
          action: "archive",
          actorRole: "admin",
          actorLabel: "Ops Admin",
          createdAt: "2026-04-05T08:00:00.000Z",
          message: "Tool config taken offline for maintenance.",
        }),
      ],
      actorRoles: ["author", "reviewer", "admin", "reader"],
      authoring: {
        title: HOST_ITEMS[4]?.title ?? "Tooling config",
        ...(HOST_ITEMS[4]?.subtitle ? { subtitle: HOST_ITEMS[4].subtitle } : {}),
        summary: HOST_ITEMS[4]?.subtitle ?? "Review content block.",
        bodyPreview: "Offline tooling config preview.",
        visibility: "public",
        category: { key: "wrap-up", label: "Wrap-up" },
        tags: [{ key: "tool", label: "Tool" }],
        attachmentAssetIds: [],
      },
    },
  };
}

export function createDefaultUserState(): UserState {
  return {
    bookshelfNovelIds: new Set(DEFAULT_BOOKSHELF_NOVEL_IDS),
    progressByNovelId: structuredClone(DEFAULT_PROGRESS_BY_NOVEL_ID),
    notificationReadAtById: {},
    threadReadAtById: {},
    threadMessagesByThreadId: {},
    threadRecordsById: {},
    notificationTouchpointReceiptsByNotificationId: {},
    assetLedgerEntries: [
      createAssetLedgerEntry({
        subject: "points",
        kind: "grant",
        title: "Welcome points",
        message: "Initial points granted for the sample account.",
        createdAt: "2026-04-01T08:00:00.000Z",
        sourceType: "system",
        sourceId: "seed_points",
        pointsDelta: 1280,
      }),
      createAssetLedgerEntry({
        subject: "balance",
        kind: "grant",
        title: "Wallet seed",
        message: "Initial wallet balance seeded for sample payment and refund flows.",
        createdAt: "2026-04-01T08:00:00.000Z",
        sourceType: "system",
        sourceId: "seed_balance",
        balanceDeltaCents: 6800,
      }),
      createAssetLedgerEntry({
        subject: "entitlement",
        kind: "expire",
        title: "Expired bonus entitlement",
        message: "A past bonus entitlement expired before the current sample session.",
        createdAt: "2026-03-01T08:00:00.000Z",
        sourceType: "system",
        sourceId: "seed_expired_entitlement",
        entitlement: {
          entitlementId: "ent_bonus_expired",
          key: "bonus-consultation",
          label: "Bonus consultation",
          status: "expired",
          active: false,
          productType: "benefit",
          expiresAt: "2026-03-01T08:00:00.000Z",
        },
      }),
    ],
    operationRecords: [],
    operationCooldownsByKind: {},
    feedbackDetailsById: {},
    feedbackTicketIds: [],
    feedbackFaqCatalog: [],
    feedbackSupportEntries: [],
    ordersById: {},
    orderIdByIdempotencyKey: {},
    afterSalesById: {},
    sharePreparesById: {},
    uploadsByTaskId: {},
    profileOverrides: {
      region: "Shanghai, CN",
      bio: "Sample user profile for shared account-domain integration.",
    },
    relationTarget: {
      targetUserId: "creator_sample",
      displayName: "MiniX Mentor",
      following: true,
      followedBy: true,
      friend: true,
      friendState: "mutual",
      blocked: false,
      remarkName: "MiniX User",
    },
    relationRecordsByUserId: {
      creator_sample: {
        targetUserId: "creator_sample",
        displayName: "MiniX Mentor",
        following: true,
        followedBy: true,
        friend: true,
        friendState: "mutual",
        blocked: false,
        remarkName: "Coach Lin",
        lastInteractionAt: "2026-04-10T08:00:00.000Z",
      },
      practice_buddy: {
        targetUserId: "practice_buddy",
        displayName: "Practice Buddy",
        following: true,
        followedBy: false,
        friend: false,
        friendState: "outgoing_request",
        blocked: false,
        remarkName: "Grammar buddy",
        lastInteractionAt: "2026-04-09T08:00:00.000Z",
      },
      reader_fan: {
        targetUserId: "reader_fan",
        displayName: "Reader Fan",
        following: false,
        followedBy: true,
        friend: false,
        friendState: "incoming_request",
        blocked: false,
        lastInteractionAt: "2026-04-08T08:00:00.000Z",
      },
      review_editor: {
        targetUserId: "review_editor",
        displayName: "Review Editor",
        following: true,
        followedBy: true,
        friend: true,
        friendState: "mutual",
        blocked: false,
        lastInteractionAt: "2026-04-07T08:00:00.000Z",
      },
      noisy_spam: {
        targetUserId: "noisy_spam",
        displayName: "Noisy Spam",
        following: false,
        followedBy: false,
        friend: false,
        friendState: "none",
        blocked: true,
        remarkName: "Muted seller",
        lastInteractionAt: "2026-04-06T08:00:00.000Z",
      },
    },
    managedContentById: createDefaultManagedContentEntries(),
  };
}

function resolveUserAvailability(session: SessionRecord, userState: UserState): UserAvailabilityStatus {
  if (session.authStatus === "guest") {
    return "guest";
  }

  return userState.availabilityStatus ?? "enabled";
}

function resolveOperationCooldown(
  userState: UserState,
  kind: AccountOperationKind,
  now = Date.now(),
): AccountOperationCooldown | undefined {
  userState.operationCooldownsByKind ??= {};
  const cooldown = userState.operationCooldownsByKind[kind];
  if (!cooldown) {
    return undefined;
  }

  const expiresAtMs = cooldown.expiresAt ? Date.parse(cooldown.expiresAt) : Number.NaN;
  const secondsRemaining = Number.isFinite(expiresAtMs) ? Math.max(0, Math.ceil((expiresAtMs - now) / 1000)) : 0;
  const active = cooldown.active && secondsRemaining > 0;
  if (!active) {
    delete userState.operationCooldownsByKind[kind];
    return undefined;
  }

  const nextCooldown: AccountOperationCooldown = {
    ...cooldown,
    active,
    secondsRemaining,
  };
  userState.operationCooldownsByKind[kind] = nextCooldown;
  return nextCooldown;
}

export function setAccountOperationCooldown(
  userState: UserState,
  input: {
    kind: AccountOperationKind;
    label: string;
    durationMs: number;
    now?: number;
  },
): AccountOperationCooldown {
  const now = input.now ?? Date.now();
  const cooldown: AccountOperationCooldown = {
    active: true,
    label: input.label,
    secondsRemaining: Math.max(0, Math.ceil(input.durationMs / 1000)),
    expiresAt: new Date(now + input.durationMs).toISOString(),
  };
  userState.operationCooldownsByKind[input.kind] = cooldown;
  return cooldown;
}

export function clearAccountOperationCooldown(userState: UserState, kind: AccountOperationKind): void {
  delete userState.operationCooldownsByKind[kind];
}

export function resolveAccountSecurityPhoneNumber(
  session: SessionRecord,
  userState: UserState,
): string | undefined {
  if (userState.boundPhoneNumber) {
    return userState.boundPhoneNumber;
  }

  return session.identity.phoneBound ? "13800000001" : undefined;
}

function createSecurityCenter(userState: UserState): SecurityCenter {
  const security = userState.authSecurity;
  const deviceIdentities: AuthDeviceIdentity[] = security
    ? Object.values(security.devicesById ?? {})
        .slice()
        .sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt))
        .map((device) => ({ ...device }))
    : [];
  const auditEvents: AuthSecurityAuditEvent[] = security?.auditEvents
    ? security.auditEvents.map((event) => ({ ...event }))
    : [];
  const latestRateLimit: AuthRateLimitState | undefined = security?.rateLimitStatesByScope
    ? Object.values(security.rateLimitStatesByScope)
        .slice()
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
    : undefined;
  const latestPrompt: AuthSecurityPrompt | undefined = security?.latestPrompt ? { ...security.latestPrompt } : undefined;

  return {
    deviceIdentities,
    auditEvents,
    ...(latestRateLimit ? { latestRateLimit: { ...latestRateLimit } } : {}),
    ...(latestPrompt ? { latestPrompt } : {}),
  };
}

function resolveProviderLabel(provider: string): string {
  const normalized = provider.trim();
  if (normalized.length === 0) {
    return "Provider";
  }

  if (normalized === "wechat-open-platform") {
    return "WeChat Open Platform";
  }

  return normalized
    .split(/[-_]+/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function createProviderSubject(provider: string, providerUserId: string): string {
  return `${provider.toLowerCase()}:${providerUserId}`;
}

function getProviderCredentialsForUser(userState: UserState, userId: string) {
  return Object.values(userState.authSecurity?.oauthCredentialsByProviderSubject ?? {}).filter((record) => record.userId === userId);
}

function createProviderIdentities(session: SessionRecord, userState: UserState): AuthProviderIdentity[] {
  const linkedProviders = getProviderCredentialsForUser(userState, session.userId)
    .slice()
    .sort((left, right) => (right.lastAuthorizedAt ?? right.linkedAt ?? right.createdAt ?? 0) - (left.lastAuthorizedAt ?? left.linkedAt ?? left.createdAt ?? 0));

  return linkedProviders.map((record) => {
    const active = (record.authorizationStatus ?? "active") === "active";
    const canUnlink = hasFallbackCredential(session, userState, {
      excludingProvider: {
        provider: record.provider,
        providerUserId: record.providerUserId,
      },
    });
    const providerSafetyBlockedReason = "Another usable login method must remain available before removing this provider.";
    return {
      provider: record.provider,
      providerLabel: resolveProviderLabel(record.provider),
      providerUserId: record.providerUserId,
      authorizationStatus: record.authorizationStatus ?? "active",
      loginEnabled: active,
      linkedAt: new Date(record.linkedAt ?? record.createdAt).toISOString(),
      ...(record.lastAuthorizedAt ? { lastAuthorizedAt: new Date(record.lastAuthorizedAt).toISOString() } : {}),
      ...(record.revokedAt ? { revokedAt: new Date(record.revokedAt).toISOString() } : {}),
      ...(record.revocationReason ? { revocationReason: record.revocationReason } : {}),
      actions: [
        {
          kind: "unlink",
          label: "Unlink provider",
          available: canUnlink,
          destructive: true,
          ...(canUnlink ? {} : { blockedReason: providerSafetyBlockedReason }),
        },
        {
          kind: active ? "revoke" : "reauthorize",
          label: active ? "Revoke authorization" : "Reauthorize provider",
          available: active ? canUnlink : true,
          destructive: active,
          ...(active && !canUnlink ? { blockedReason: providerSafetyBlockedReason } : {}),
        },
      ],
    };
  });
}

export function hasFallbackCredential(
  session: SessionRecord,
  userState: UserState,
  input?: {
    excludingProvider?: {
      provider: string;
      providerUserId: string;
    };
  },
): boolean {
  const passwordCredentialCount = Object.keys(userState.authSecurity?.passwordCredentialsBySubject ?? {}).length;
  const activeProviderCount = getProviderCredentialsForUser(userState, session.userId).filter((record) => {
    if ((record.authorizationStatus ?? "active") !== "active") {
      return false;
    }
    if (!input?.excludingProvider) {
      return true;
    }
    return createProviderSubject(record.provider, record.providerUserId) !==
      createProviderSubject(input.excludingProvider.provider, input.excludingProvider.providerUserId);
  }).length;
  return Boolean(resolveAccountSecurityPhoneNumber(session, userState)) || passwordCredentialCount > 0 || activeProviderCount > 0;
}

export function appendAccountOperationRecord(
  userState: UserState,
  input: {
    kind: AccountOperationKind;
    status: AccountOperationRecord["status"];
    actorLabel: string;
    message: string;
    createdAt?: string;
    verificationPurpose?: AuthVerificationPurpose;
    notificationHookLabel?: string;
  },
): AccountOperationRecord {
  const record: AccountOperationRecord = {
    recordId: `account_op_${crypto.randomUUID()}`,
    kind: input.kind,
    status: input.status,
    actorLabel: input.actorLabel,
    createdAt: input.createdAt ?? new Date().toISOString(),
    message: input.message,
    ...(input.verificationPurpose ? { verificationPurpose: input.verificationPurpose } : {}),
    ...(input.notificationHookLabel ? { notificationHookLabel: input.notificationHookLabel } : {}),
  };
  userState.operationRecords = [record, ...userState.operationRecords].slice(0, 20);
  return record;
}

function createAccountOperations(
  session: SessionRecord,
  userState: UserState,
  availability: UserAvailabilityStatus,
): AccountOperation[] {
  const phoneBound = Boolean(resolveAccountSecurityPhoneNumber(session, userState));
  const wechatBound = Boolean(userState.wechatBoundOverride ?? session.identity.wechatBound);
  const fallbackCredentialAvailable = hasFallbackCredential(session, userState);
  const changePhoneCooldown = resolveOperationCooldown(userState, "change_phone");
  const unbindCooldown = resolveOperationCooldown(userState, "unbind_wechat");
  const cancellationCooldown =
    resolveOperationCooldown(userState, "request_cancellation") ??
    (userState.pendingCancellation
      ? setAccountOperationCooldown(userState, {
          kind: "request_cancellation",
          label: "Cancellation is in the cooling-off window and can still be revoked.",
          durationMs: Math.max(0, Date.parse(userState.pendingCancellation.effectiveAt) - Date.now()),
          now: Date.now(),
        })
      : undefined);
  const restrictedReason =
    availability === "frozen"
      ? "This account is frozen and cannot change account settings right now."
      : availability === "blacklisted"
        ? "This account is blacklisted and account operations are locked."
        : availability === "cancellation_pending"
          ? "Cancellation is already pending for this account."
          : undefined;

  return [
    {
      kind: "edit_profile",
      label: "Edit profile",
      available: availability === "enabled",
      statusLabel:
        availability === "enabled"
          ? "You can update nickname, region, and bio."
          : restrictedReason ?? "Unavailable",
      ...(availability === "enabled" ? {} : { blockedReason: restrictedReason ?? "Unavailable" }),
    },
    {
      kind: "change_phone",
      label: phoneBound ? "Change phone" : "Bind phone",
      available: availability === "enabled" && !changePhoneCooldown,
      statusLabel:
        availability === "enabled"
          ? changePhoneCooldown
            ? changePhoneCooldown.label
            : phoneBound
              ? "A verified phone can be replaced."
              : "No verified phone is currently bound."
          : restrictedReason ?? "Unavailable",
      verificationRequired: phoneBound,
      reversible: true,
      riskPrompt: {
        title: "Phone replacement changes recovery credentials",
        message: phoneBound
          ? "Confirm the current device owner and validate both phone numbers before replacing the bound phone."
          : "Binding a phone will make it the primary recovery credential.",
        severity: "warning",
        acknowledgeLabel: "I understand the recovery impact",
      },
      ...(changePhoneCooldown ? { cooldown: changePhoneCooldown } : {}),
      ...(availability === "enabled" && !changePhoneCooldown
        ? {}
        : { blockedReason: restrictedReason ?? changePhoneCooldown?.label ?? "Unavailable" }),
    },
    {
      kind: "unbind_wechat",
      label: "Unbind WeChat",
      available: availability === "enabled" && wechatBound && phoneBound && fallbackCredentialAvailable && !unbindCooldown,
      statusLabel: !wechatBound
        ? "No WeChat binding is active."
        : availability !== "enabled"
          ? restrictedReason ?? "Unavailable"
          : unbindCooldown
            ? unbindCooldown.label
            : !phoneBound
              ? "A verified phone security check is required before unbinding WeChat."
              : !fallbackCredentialAvailable
                ? "Another recovery credential must remain available before unbinding WeChat."
                : "WeChat binding can be removed from the current account.",
      verificationRequired: true,
      reversible: true,
      riskPrompt: {
        title: "WeChat unbinding removes a sign-in method",
        message: "Keep another recovery credential available before removing the WeChat binding.",
        severity: "warning",
        acknowledgeLabel: "Unbind WeChat",
      },
      ...(unbindCooldown ? { cooldown: unbindCooldown } : {}),
      ...(availability === "enabled" && wechatBound && phoneBound && fallbackCredentialAvailable && !unbindCooldown
        ? {}
        : {
            blockedReason:
              restrictedReason ??
              unbindCooldown?.label ??
              (!wechatBound
                ? "No WeChat binding is active."
                : !phoneBound
                  ? "A verified phone security check is required before unbinding WeChat."
                  : "Another recovery credential must remain available before unbinding WeChat."),
          }),
    },
    {
      kind: "request_cancellation",
      label: "Request cancellation",
      available: availability === "enabled" && phoneBound,
      statusLabel:
        availability === "cancellation_pending"
          ? "Cancellation has already been requested."
          : availability === "enabled"
            ? phoneBound
              ? "Submit a cancellation request for the current account."
              : "A verified phone security check is required before requesting cancellation."
            : restrictedReason ?? "Unavailable",
      verificationRequired: true,
      destructive: true,
      reversible: true,
      riskPrompt: {
        title: "Cancellation schedules irreversible account closure",
        message: "The request enters a cooling-off period first. During that window you can still revoke it.",
        severity: "critical",
        acknowledgeLabel: "Request cancellation",
      },
      ...(cancellationCooldown ? { cooldown: cancellationCooldown } : {}),
      ...(availability === "enabled" && phoneBound
        ? {}
        : {
            blockedReason:
              restrictedReason ??
              (phoneBound
                ? cancellationCooldown?.label ?? "Unavailable"
                : "A verified phone security check is required before requesting cancellation."),
          }),
    },
    {
      kind: "revoke_cancellation",
      label: "Revoke cancellation",
      available:
        availability === "cancellation_pending" &&
        Boolean(userState.pendingCancellation) &&
        Boolean(cancellationCooldown?.active),
      statusLabel:
        availability === "cancellation_pending" && userState.pendingCancellation
          ? `Revocable until ${userState.pendingCancellation.revokeUntil}.`
          : "No cancellation request is pending.",
      ...(cancellationCooldown ? { cooldown: cancellationCooldown } : {}),
      ...(availability === "cancellation_pending" && userState.pendingCancellation && cancellationCooldown?.active
        ? {}
        : {
            blockedReason:
              availability === "cancellation_pending"
                ? "The cancellation request can no longer be revoked."
                : "No cancellation request is pending.",
          }),
    },
  ];
}

function ensureRelationRecords(userState: UserState): NonNullable<UserState["relationRecordsByUserId"]> {
  if (userState.relationRecordsByUserId) {
    return userState.relationRecordsByUserId;
  }

  const fallback: NonNullable<UserState["relationRecordsByUserId"]> = userState.relationTarget
    ? {
        [userState.relationTarget.targetUserId]: {
          ...userState.relationTarget,
          friendState: userState.relationTarget.friend ? "mutual" : "none",
        },
      }
    : {};
  userState.relationRecordsByUserId = fallback;
  return fallback;
}

function createRelationSummary(record: {
  following: boolean;
  followedBy: boolean;
  friend: boolean;
  friendState?: UserFriendState;
  blocked: boolean;
}): string {
  if (record.blocked) {
    return "Blocked contact";
  }

  if (record.friendState === "incoming_request") {
    return "Incoming friend request";
  }

  if (record.friendState === "outgoing_request") {
    return "Pending friend request";
  }

  if (record.friend || record.friendState === "mutual") {
    return "Mutual connection";
  }

  if (record.following && record.followedBy) {
    return "Mutual follow";
  }

  if (record.following) {
    return "Following";
  }

  if (record.followedBy) {
    return "Follower";
  }

  return "Not following";
}

function createRelationActions(
  record: NonNullable<UserState["relationRecordsByUserId"]>[string],
  availability: UserAvailabilityStatus,
): UserRelationAction[] {
  const actionBlockedReason =
    availability === "enabled" ? undefined : "Relationship actions are unavailable for the current account status.";
  const actions: UserRelationAction[] = [
    {
      kind: record.following ? "unfollow" : "follow",
      label: record.following ? "Unfollow" : "Follow",
      available: availability === "enabled" && !record.blocked,
      active: record.following,
      ...(availability === "enabled" && !record.blocked
        ? {}
        : { blockedReason: actionBlockedReason ?? "Blocked users cannot be followed." }),
    },
    {
      kind: record.blocked ? "unblock" : "block",
      label: record.blocked ? "Unblock" : "Block",
      available: availability === "enabled",
      active: record.blocked,
      ...(availability === "enabled" || !actionBlockedReason ? {} : { blockedReason: actionBlockedReason }),
    },
    {
      kind: "set_remark",
      label: record.remarkName ? "Update remark" : "Set remark",
      available: availability === "enabled",
      active: Boolean(record.remarkName),
      requiresInput: true,
      ...(availability === "enabled" || !actionBlockedReason ? {} : { blockedReason: actionBlockedReason }),
    },
  ];

  if (record.remarkName) {
    actions.push({
      kind: "clear_remark",
      label: "Clear remark",
      available: availability === "enabled",
      active: true,
      ...(availability === "enabled" || !actionBlockedReason ? {} : { blockedReason: actionBlockedReason }),
    });
  }

  return actions;
}

function createRelationTarget(
  record: NonNullable<UserState["relationRecordsByUserId"]>[string],
  availability: UserAvailabilityStatus,
): UserRelationTarget {
  return {
    targetUserId: record.targetUserId,
    displayName: record.displayName,
    relationshipSummary: createRelationSummary(record),
    following: record.following,
    followedBy: record.followedBy,
    friend: record.friend,
    ...(record.friendState ? { friendState: record.friendState } : {}),
    blocked: record.blocked,
    ...(record.remarkName ? { remarkName: record.remarkName } : {}),
    actions: createRelationActions(record, availability),
  };
}

function createPrimaryRelationTarget(
  userState: UserState,
  availability: UserAvailabilityStatus,
): UserRelationTarget[] {
  const records = Object.values(ensureRelationRecords(userState));
  return records
    .sort((left, right) => (right.lastInteractionAt ?? "").localeCompare(left.lastInteractionAt ?? ""))
    .slice(0, 3)
    .map((record) => createRelationTarget(record, availability));
}

export function listUserRelations(
  userState: UserState,
  availability: UserAvailabilityStatus,
  request: ListUserRelationsRequest,
): UserRelationList {
  const page = request.page ?? 1;
  const pageSize = request.pageSize ?? 10;
  const keyword = request.keyword?.trim().toLowerCase();
  const records = Object.values(ensureRelationRecords(userState));
  const filtered = records
    .filter((record) => {
      switch (request.kind) {
        case "following":
          return record.following && !record.blocked;
        case "followers":
          return record.followedBy && !record.blocked;
        case "friends":
          return record.friend || record.friendState === "mutual" || record.friendState === "incoming_request" || record.friendState === "outgoing_request";
        case "blocked":
          return record.blocked;
        case "remarks":
          return Boolean(record.remarkName);
      }
    })
    .filter((record) =>
      !keyword
        ? true
        : [record.displayName, record.remarkName ?? "", createRelationSummary(record)].some((value) =>
            value.toLowerCase().includes(keyword),
          ),
    )
    .sort((left, right) => (right.lastInteractionAt ?? "").localeCompare(left.lastInteractionAt ?? ""));

  const startIndex = (page - 1) * pageSize;
  const items = filtered.slice(startIndex, startIndex + pageSize).map((record): UserRelationListItem => ({
    ...createRelationTarget(record, availability),
    listKind: request.kind,
    ...(record.lastInteractionAt ? { lastInteractionAt: record.lastInteractionAt } : {}),
  }));

  return {
    kind: request.kind,
    items,
    pagination: {
      page,
      pageSize,
      hasMore: startIndex + pageSize < filtered.length,
      total: filtered.length,
    },
    ...(request.keyword ? { keyword: request.keyword } : {}),
  };
}

export function createSharePrepareResponse(
  request: SharePrepareRequest,
  requestUrl: string,
  now = new Date().toISOString(),
): SharePrepareResponse {
  const attributionId = request.shareAttribution.attributionId ?? `share_${crypto.randomUUID()}`;
  const shortCode = attributionId.slice(-8);
  const channelMarker =
    request.shareChannel.channelMarker ??
    request.sharePayload.channelMarker ??
    request.shareAttribution.channelMarker ??
    "minix-share";
  const landingPath = request.sharePayload.landingPath ?? "/login";
  const landingUrl = request.sharePayload.landingUrl ?? new URL(landingPath, requestUrl).toString();
  const shortLink = request.sharePayload.shortLink ?? new URL(`/share/resolve?shortCode=${shortCode}`, requestUrl).toString();
  const posterAsset =
    request.sharePayload.scenario === "poster" || request.shareChannel.kind === "poster_image"
      ? {
          assetId: `share_poster_${shortCode}`,
          provider: "sample" as const,
          url: new URL(`/share-posters/${shortCode}.svg`, requestUrl).toString(),
          createdAt: now,
          expiresAt: new Date(Date.parse(now) + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }
      : undefined;
  const shortLinkRecord = {
    attributionId,
    shortCode,
    shortLink,
    landingPath,
    landingUrl,
    createdAt: now,
    resolvedCount: 0,
  };

  const landingTarget = {
    ...(request.sharePayload.landingTarget?.routeId ? { routeId: request.sharePayload.landingTarget.routeId } : {}),
    path: landingPath,
    url: landingUrl,
    shortLink,
    shortCode,
    ...(request.sharePayload.landingTarget?.params ? { params: request.sharePayload.landingTarget.params } : {}),
    channelMarker,
    ...(request.redirectTarget ? { authRedirect: request.redirectTarget } : {}),
  };

  const shareAttribution = {
    ...request.shareAttribution,
    attributionId,
    channelMarker,
    returnFlowRecognized: false,
    shareCount: request.shareAttribution.shareCount + 1,
    clickCount: request.shareAttribution.clickCount,
    returnCount: request.shareAttribution.returnCount,
    conversionCount: request.shareAttribution.conversionCount,
    preparedAt: now,
    lastSharedAt: now,
    ...(request.redirectTarget ? { returnTarget: request.redirectTarget } : {}),
  };
  const attributionReport: ShareAttributionReport = {
    shareAttribution,
    shortLinkRecord,
    ...(posterAsset ? { posterAsset } : {}),
  };

  return {
    sharePayload: {
      ...request.sharePayload,
      landingPath,
      landingUrl,
      shortLink,
      ...(posterAsset ? { posterImageUrl: posterAsset.url } : {}),
      channelMarker,
      shareToken: attributionId,
      landingTarget,
      ...(request.redirectTarget ? { returnTarget: request.redirectTarget } : {}),
    },
    shareChannel: {
      ...request.shareChannel,
      channelMarker,
    },
    shareAttribution,
    landingTarget,
    shortLinkRecord,
    ...(posterAsset ? { posterAsset } : {}),
    attributionReport,
  };
}

export function recognizeShareReturn(
  existing: SharePrepareResponse,
  request: ShareReturnRecognitionRequest,
  now = new Date().toISOString(),
): ShareReturnRecognitionResponse {
  const next = structuredClone(existing);
  next.shareAttribution.returnFlowRecognized = request.outcome === "return" || request.outcome === "conversion";
  if (request.outcome === "click") {
    next.shareAttribution.clickCount += 1;
    next.shareAttribution.lastClickAt = now;
  }
  if (request.outcome === "return" || request.outcome === "conversion") {
    next.shareAttribution.returnCount += 1;
    next.shareAttribution.lastReturnAt = now;
  }
  const lastLandingPath = request.recognizedPath ?? next.landingTarget.path;
  if (lastLandingPath) {
    next.shareAttribution.lastLandingPath = lastLandingPath;
  }
  if (request.outcome === "click" && next.shortLinkRecord) {
    next.shortLinkRecord.resolvedCount += 1;
    next.shortLinkRecord.lastResolvedAt = now;
  }

  if (request.outcome === "conversion") {
    next.shareAttribution.conversionCount += 1;
    next.shareAttribution.lastConversionAt = now;
    if (request.recognizedUserId) {
      next.shareAttribution.inviteBoundUserId = request.recognizedUserId;
    }
  }

  return {
    sharePayload: next.sharePayload,
    shareChannel: next.shareChannel,
    shareAttribution: next.shareAttribution,
    landingTarget: next.landingTarget,
    ...(next.shortLinkRecord ? { shortLinkRecord: next.shortLinkRecord } : {}),
    ...(next.posterAsset ? { posterAsset: next.posterAsset } : {}),
    attributionReport: {
      shareAttribution: next.shareAttribution,
      ...(next.shortLinkRecord ? { shortLinkRecord: next.shortLinkRecord } : {}),
      ...(next.posterAsset ? { posterAsset: next.posterAsset } : {}),
    },
  };
}

export function resolveShareShortLink(
  existing: SharePrepareResponse,
  now = new Date().toISOString(),
): ShareShortLinkResolveResponse {
  const next = structuredClone(existing);
  if (next.shortLinkRecord) {
    next.shortLinkRecord.resolvedCount += 1;
    next.shortLinkRecord.lastResolvedAt = now;
  }
  next.shareAttribution.clickCount += 1;
  next.shareAttribution.lastClickAt = now;
  if (next.landingTarget.path) {
    next.shareAttribution.lastLandingPath = next.landingTarget.path;
  }

  return {
    sharePayload: next.sharePayload,
    shareChannel: next.shareChannel,
    shareAttribution: next.shareAttribution,
    landingTarget: next.landingTarget,
    shortLinkRecord:
      next.shortLinkRecord ?? {
        attributionId: next.shareAttribution.attributionId ?? next.sharePayload.shareToken ?? "share",
        shortCode: "share",
        shortLink: next.sharePayload.shortLink ?? next.landingTarget.shortLink ?? "",
        landingUrl: next.sharePayload.landingUrl ?? next.landingTarget.url ?? "",
        createdAt: now,
        resolvedCount: 1,
        lastResolvedAt: now,
      },
    ...(next.posterAsset ? { posterAsset: next.posterAsset } : {}),
    attributionReport: {
      shareAttribution: next.shareAttribution,
      shortLinkRecord:
        next.shortLinkRecord ?? {
          attributionId: next.shareAttribution.attributionId ?? next.sharePayload.shareToken ?? "share",
          shortCode: "share",
          shortLink: next.sharePayload.shortLink ?? next.landingTarget.shortLink ?? "",
          landingUrl: next.sharePayload.landingUrl ?? next.landingTarget.url ?? "",
          createdAt: now,
          resolvedCount: 1,
          lastResolvedAt: now,
        },
      ...(next.posterAsset ? { posterAsset: next.posterAsset } : {}),
    },
  };
}

export function createShareAttributionReport(existing: SharePrepareResponse): ShareAttributionReportResponse {
  return {
    sharePayload: existing.sharePayload,
    shareChannel: existing.shareChannel,
    shareAttribution: existing.shareAttribution,
    ...(existing.landingTarget ? { landingTarget: existing.landingTarget } : {}),
    ...(existing.shortLinkRecord ? { shortLinkRecord: existing.shortLinkRecord } : {}),
    ...(existing.posterAsset ? { posterAsset: existing.posterAsset } : {}),
    attributionReport: {
      shareAttribution: existing.shareAttribution,
      ...(existing.shortLinkRecord ? { shortLinkRecord: existing.shortLinkRecord } : {}),
      ...(existing.posterAsset ? { posterAsset: existing.posterAsset } : {}),
    },
  };
}

function cloneUploadProgress(progress: UploadProgress): UploadProgress {
  return {
    completedBytes: progress.completedBytes,
    totalBytes: progress.totalBytes,
    percentage: progress.percentage,
  };
}

function cloneUploadAsset(asset: UploadAsset): UploadAsset {
  return {
    assetId: asset.assetId,
    fileType: asset.fileType,
    fileName: asset.fileName,
    url: asset.url,
    ...(asset.thumbnailUrl ? { thumbnailUrl: asset.thumbnailUrl } : {}),
    ...(asset.coverImageUrl ? { coverImageUrl: asset.coverImageUrl } : {}),
    metadata: {
      sizeBytes: asset.metadata.sizeBytes,
      ...(asset.metadata.checksum ? { checksum: asset.metadata.checksum } : {}),
      ...(asset.metadata.checksumAlgorithm ? { checksumAlgorithm: asset.metadata.checksumAlgorithm } : {}),
      ...(asset.metadata.mimeType ? { mimeType: asset.metadata.mimeType } : {}),
      ...(asset.metadata.width !== undefined ? { width: asset.metadata.width } : {}),
      ...(asset.metadata.height !== undefined ? { height: asset.metadata.height } : {}),
      ...(asset.metadata.durationSeconds !== undefined ? { durationSeconds: asset.metadata.durationSeconds } : {}),
      ...(asset.metadata.pageCount !== undefined ? { pageCount: asset.metadata.pageCount } : {}),
    },
  };
}

function cloneUploadTask(task: UploadTask): UploadTask {
  return {
    taskId: task.taskId,
    scenario: task.scenario,
    fileType: task.fileType,
    stage: task.stage,
    ...(task.fileName ? { fileName: task.fileName } : {}),
    progress: cloneUploadProgress(task.progress),
    chunkingReserved: task.chunkingReserved,
    ...(task.transferMode ? { transferMode: task.transferMode } : {}),
    ...(task.sessionId ? { sessionId: task.sessionId } : {}),
    ...(task.chunkCount !== undefined ? { chunkCount: task.chunkCount } : {}),
    ...(task.uploadedChunkCount !== undefined ? { uploadedChunkCount: task.uploadedChunkCount } : {}),
    ...(task.integrity
      ? {
          integrity: {
            checksumAlgorithm: task.integrity.checksumAlgorithm,
            fileChecksum: task.integrity.fileChecksum,
            expectedSizeBytes: task.integrity.expectedSizeBytes,
          },
        }
      : {}),
    governance: {
      maxSizeBytes: task.governance.maxSizeBytes,
      acceptedFileTypes: [...task.governance.acceptedFileTypes],
      sensitiveReviewRequired: task.governance.sensitiveReviewRequired,
      ...(task.governance.expiresInDays !== undefined ? { expiresInDays: task.governance.expiresInDays } : {}),
    },
    reviewStatus: task.reviewStatus,
    ...(task.reviewMessage ? { reviewMessage: task.reviewMessage } : {}),
    lifecycle: {
      backendBacked: task.lifecycle.backendBacked,
      retentionStatus: task.lifecycle.retentionStatus,
      retryCount: task.lifecycle.retryCount,
      canRetry: task.lifecycle.canRetry,
      canCancel: task.lifecycle.canCancel,
      ...(task.lifecycle.lastTransitionAt ? { lastTransitionAt: task.lifecycle.lastTransitionAt } : {}),
      ...(task.lifecycle.expiresAt ? { expiresAt: task.lifecycle.expiresAt } : {}),
    },
  };
}

function cloneUploadError(uploadError: UploadError): UploadError {
  return {
    code: uploadError.code,
    message: uploadError.message,
    recoverable: uploadError.recoverable,
    retryable: uploadError.retryable,
    stage: uploadError.stage,
  };
}

function cloneUploadTransferPayload(transfer: UploadTransferPayload): UploadTransferPayload {
  return {
    mode: transfer.mode,
    checksumAlgorithm: transfer.checksumAlgorithm,
    fileChecksum: transfer.fileChecksum,
    totalBytes: transfer.totalBytes,
    chunkSizeBytes: transfer.chunkSizeBytes,
    chunks: transfer.chunks.map((chunk) => ({
      chunkIndex: chunk.chunkIndex,
      byteOffset: chunk.byteOffset,
      byteLength: chunk.byteLength,
      checksum: chunk.checksum,
      checksumAlgorithm: chunk.checksumAlgorithm,
      dataBase64: chunk.dataBase64,
    })),
  };
}

function cloneUploadChunkReceipt(receipt: UploadChunkReceipt): UploadChunkReceipt {
  return {
    chunkIndex: receipt.chunkIndex,
    byteOffset: receipt.byteOffset,
    byteLength: receipt.byteLength,
    checksum: receipt.checksum,
    checksumAlgorithm: receipt.checksumAlgorithm,
    receivedAt: receipt.receivedAt,
  };
}

function cloneUploadSession(session: UploadSession): UploadSession {
  return {
    sessionId: session.sessionId,
    uploadToken: session.uploadToken,
    objectKey: session.objectKey,
    mode: session.mode,
    checksumAlgorithm: session.checksumAlgorithm,
    chunkSizeBytes: session.chunkSizeBytes,
    chunkCount: session.chunkCount,
    receivedChunkCount: session.receivedChunkCount,
    nextChunkIndex: session.nextChunkIndex,
    resumeSupported: session.resumeSupported,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  };
}

function cloneUploadReviewRecord(reviewRecord: UploadReviewRecord): UploadReviewRecord {
  return {
    status: reviewRecord.status,
    provider: reviewRecord.provider,
    ...(reviewRecord.reviewedAt ? { reviewedAt: reviewRecord.reviewedAt } : {}),
    ...(reviewRecord.message ? { message: reviewRecord.message } : {}),
    ...(reviewRecord.reasonCodes ? { reasonCodes: [...reviewRecord.reasonCodes] } : {}),
  };
}

function cloneUploadCleanupRecord(cleanupRecord: UploadCleanupRecord): UploadCleanupRecord {
  return {
    retentionStatus: cleanupRecord.retentionStatus,
    ...(cleanupRecord.cleanupScheduledAt ? { cleanupScheduledAt: cleanupRecord.cleanupScheduledAt } : {}),
    ...(cleanupRecord.cleanupReason ? { cleanupReason: cleanupRecord.cleanupReason } : {}),
    referenced: cleanupRecord.referenced,
  };
}

function cloneUploadReference(reference: UploadReference): UploadReference {
  return {
    ownerType: reference.ownerType,
    ownerId: reference.ownerId,
    role: reference.role,
    attachedAt: reference.attachedAt,
  };
}

function cloneUploadSelectionResult(selection: UploadSelectionResult): UploadSelectionResult {
  return {
    uploadTask: cloneUploadTask(selection.uploadTask),
    ...(selection.uploadAsset ? { uploadAsset: cloneUploadAsset(selection.uploadAsset) } : {}),
    ...(selection.uploadError ? { uploadError: cloneUploadError(selection.uploadError) } : {}),
    ...(selection.transfer ? { transfer: cloneUploadTransferPayload(selection.transfer) } : {}),
  };
}

function cloneStoredUploadRecord(record: StoredUploadRecord): StoredUploadRecord {
  return {
    source: record.source,
    selection: cloneUploadSelectionResult(record.selection),
    uploadTask: cloneUploadTask(record.uploadTask),
    ...(record.uploadAsset ? { uploadAsset: cloneUploadAsset(record.uploadAsset) } : {}),
    ...(record.uploadError ? { uploadError: cloneUploadError(record.uploadError) } : {}),
    ...(record.transfer ? { transfer: cloneUploadTransferPayload(record.transfer) } : {}),
    ...(record.session ? { session: cloneUploadSession(record.session) } : {}),
    ...(record.receivedChunk ? { receivedChunk: cloneUploadChunkReceipt(record.receivedChunk) } : {}),
    ...(record.reviewRecord ? { reviewRecord: cloneUploadReviewRecord(record.reviewRecord) } : {}),
    ...(record.cleanupRecord ? { cleanupRecord: cloneUploadCleanupRecord(record.cleanupRecord) } : {}),
    references: record.references.map(cloneUploadReference),
    chunksByIndex: Object.fromEntries(
      Object.entries(record.chunksByIndex).map(([key, value]) => [key, cloneUploadChunkReceipt(value)]),
    ),
    binaryByChunkIndex: { ...record.binaryByChunkIndex },
    ...(record.binaryObjectKey ? { binaryObjectKey: record.binaryObjectKey } : {}),
  };
}

function buildUploadedAssetUrl(assetId: string, requestUrl: string): string {
  return new URL(`/uploads/assets/${assetId}`, requestUrl).toString();
}

function buildUploadedThumbnailUrl(assetId: string, requestUrl: string): string {
  return new URL(`/uploads/assets/${assetId}/thumb`, requestUrl).toString();
}

function createUploadHash(buffer: Uint8Array): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function decodeBase64ToBuffer(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, "base64"));
}

function createSyntheticTransferPayload(
  task: UploadTask,
  selectedAsset: UploadAsset,
  userState?: UserState,
): UploadTransferPayload {
  const totalBytes = selectedAsset.metadata.sizeBytes;
  const seed = `${task.scenario}:${task.fileType}:${task.fileName ?? selectedAsset.fileName}:`;
  const repeated = seed.repeat(Math.ceil(totalBytes / Math.max(seed.length, 1))).slice(0, totalBytes);
  const configuredChunkSize = resolveSettingsState(userState ?? createDefaultUserState(), undefined).effectivePolicy.device.uploadChunkSizeBytes;
  const chunkSizeBytes = Math.min(configuredChunkSize, Math.max(totalBytes, 1));
  const chunks: UploadTransferPayload["chunks"] = [];
  let byteOffset = 0;
  while (byteOffset < totalBytes) {
    const nextLength = Math.min(chunkSizeBytes, totalBytes - byteOffset);
    const chunkBytes = Buffer.from(repeated.slice(byteOffset, byteOffset + nextLength), "utf8");
    chunks.push({
      chunkIndex: chunks.length,
      byteOffset,
      byteLength: nextLength,
      checksum: createUploadHash(chunkBytes),
      checksumAlgorithm: "sha256",
      dataBase64: chunkBytes.toString("base64"),
    });
    byteOffset += nextLength;
  }

  return {
    mode: chunks.length > 1 ? "chunked" : "single_part",
    checksumAlgorithm: "sha256",
    fileChecksum: createUploadHash(Buffer.from(repeated, "utf8")),
    totalBytes,
    chunkSizeBytes,
    chunks,
  };
}

function resolveSelectionTransfer(selection: UploadSelectionResult, userState?: UserState): UploadTransferPayload | undefined {
  if (selection.transfer) {
    return cloneUploadTransferPayload(selection.transfer);
  }
  if (!selection.uploadAsset) {
    return undefined;
  }
  return createSyntheticTransferPayload(selection.uploadTask, selection.uploadAsset, userState);
}

function createUploadLifecycle(task: UploadTask, input: {
  backendBacked: boolean;
  retryCount?: number;
  canRetry: boolean;
  canCancel: boolean;
  lastTransitionAt: string;
  expiresAt?: string;
}): UploadTask["lifecycle"] {
  return {
    backendBacked: input.backendBacked,
    retentionStatus: task.stage === "canceled" ? "scheduled_cleanup" : "active",
    retryCount: input.retryCount ?? task.lifecycle.retryCount,
    canRetry: input.canRetry,
    canCancel: input.canCancel,
    lastTransitionAt: input.lastTransitionAt,
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
  };
}

function createUploadErrorRecord(
  selection: UploadSelectionResult,
  source: UploadPipelineSource,
  message: string,
  code: string,
  now: string,
): StoredUploadRecord {
  const failedTask = cloneUploadTask(selection.uploadTask);
  failedTask.stage = "failed";
  failedTask.reviewStatus = "rejected";
  failedTask.reviewMessage = message;
  failedTask.lifecycle = createUploadLifecycle(failedTask, {
    backendBacked: true,
    canRetry: true,
    canCancel: false,
    lastTransitionAt: now,
    ...(failedTask.governance.expiresInDays !== undefined
      ? { expiresAt: new Date(Date.parse(now) + failedTask.governance.expiresInDays * 24 * 60 * 60 * 1000).toISOString() }
      : {}),
  });
  return {
    source,
    selection: cloneUploadSelectionResult(selection),
    uploadTask: failedTask,
    ...(selection.uploadAsset ? { uploadAsset: cloneUploadAsset(selection.uploadAsset) } : {}),
    uploadError: {
      code,
      message,
      recoverable: true,
      retryable: true,
      stage: "failed",
    },
    reviewRecord: {
      status: "rejected",
      provider: "sample-upload-policy",
      reviewedAt: now,
      message,
      reasonCodes: [code],
    },
    cleanupRecord: {
      retentionStatus: "scheduled_cleanup",
      cleanupScheduledAt: now,
      cleanupReason: "failed_upload",
      referenced: false,
    },
    references: [],
    chunksByIndex: {},
    binaryByChunkIndex: {},
  };
}

export function createUploadResponse(record: StoredUploadRecord): UploadPipelineResponse {
  return {
    source: record.source,
    uploadTask: cloneUploadTask(record.uploadTask),
    ...(record.uploadAsset ? { uploadAsset: cloneUploadAsset(record.uploadAsset) } : {}),
    ...(record.uploadError ? { uploadError: cloneUploadError(record.uploadError) } : {}),
    ...(record.transfer ? { transfer: cloneUploadTransferPayload(record.transfer) } : {}),
    ...(record.session ? { session: cloneUploadSession(record.session) } : {}),
    ...(record.receivedChunk ? { receivedChunk: cloneUploadChunkReceipt(record.receivedChunk) } : {}),
    ...(record.reviewRecord ? { reviewRecord: cloneUploadReviewRecord(record.reviewRecord) } : {}),
    ...(record.cleanupRecord ? { cleanupRecord: cloneUploadCleanupRecord(record.cleanupRecord) } : {}),
    ...(record.references.length > 0 ? { references: record.references.map(cloneUploadReference) } : {}),
  };
}

function updateUploadTaskProgress(task: UploadTask, completedBytes: number, totalBytes: number, uploadedChunkCount: number) {
  task.progress = {
    completedBytes,
    totalBytes,
    percentage: totalBytes > 0 ? Math.min(100, Math.round((completedBytes / totalBytes) * 100)) : 0,
  };
  task.uploadedChunkCount = uploadedChunkCount;
}

function calculateUploadExpiresAt(task: UploadTask, now: string): string | undefined {
  return task.governance.expiresInDays !== undefined
    ? new Date(Date.parse(now) + task.governance.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : undefined;
}

function updateUploadRetention(record: StoredUploadRecord, input: {
  retentionStatus: UploadCleanupRecord["retentionStatus"];
  referenced?: boolean;
  cleanupReason?: string;
  cleanupScheduledAt?: string;
}) {
  record.uploadTask.lifecycle.retentionStatus = input.retentionStatus;
  record.cleanupRecord = {
    retentionStatus: input.retentionStatus,
    ...(input.cleanupScheduledAt ? { cleanupScheduledAt: input.cleanupScheduledAt } : {}),
    ...(input.cleanupReason ? { cleanupReason: input.cleanupReason } : {}),
    referenced: input.referenced ?? record.cleanupRecord?.referenced ?? false,
  };
}

export function createUploadSessionRecord(
  request: UploadSessionRequest,
  requestUrl: string,
  userState?: UserState,
  now = new Date().toISOString(),
): StoredUploadRecord {
  const selection = cloneUploadSelectionResult(request.selection);
  const task = cloneUploadTask(selection.uploadTask);
  const selectedAsset = selection.uploadAsset ? cloneUploadAsset(selection.uploadAsset) : undefined;
  if (!selectedAsset) {
    return createUploadErrorRecord(selection, "backend_session", "The selected asset is required to open an upload session.", "UPLOAD_ASSET_REQUIRED", now);
  }
  const transfer = resolveSelectionTransfer(selection, userState);
  if (!transfer) {
    return createUploadErrorRecord(selection, "backend_session", "The selected asset did not include upload transfer data.", "UPLOAD_TRANSFER_REQUIRED", now);
  }
  if (selectedAsset.metadata.sizeBytes !== transfer.totalBytes) {
    return createUploadErrorRecord(selection, "backend_session", "The selected asset size does not match the prepared upload transfer.", "UPLOAD_SIZE_MISMATCH", now);
  }
  if (selectedAsset.metadata.sizeBytes > task.governance.maxSizeBytes) {
    return createUploadErrorRecord(selection, "backend_session", "The selected asset exceeds the configured upload size limit.", "UPLOAD_TOO_LARGE", now);
  }
  if (!task.governance.acceptedFileTypes.includes(selectedAsset.fileType)) {
    return createUploadErrorRecord(selection, "backend_session", "The selected asset type is not accepted for this upload flow.", "UPLOAD_TYPE_REJECTED", now);
  }

  const assetId = selectedAsset.assetId && selectedAsset.assetId !== "upload_asset_idle" ? selectedAsset.assetId : `upl_${crypto.randomUUID()}`;
  const taskId = task.taskId && task.taskId !== "upload_task_idle" ? task.taskId : `upload_${crypto.randomUUID()}`;
  const sessionId = `us_${crypto.randomUUID()}`;
  const expiresAt = calculateUploadExpiresAt(task, now);
  const session: UploadSession = {
    sessionId,
    uploadToken: `ut_${crypto.randomUUID()}`,
    objectKey: `object/${assetId}/${sessionId}`,
    mode: transfer.mode,
    checksumAlgorithm: transfer.checksumAlgorithm,
    chunkSizeBytes: transfer.chunkSizeBytes,
    chunkCount: transfer.chunks.length,
    receivedChunkCount: 0,
    nextChunkIndex: 0,
    resumeSupported: transfer.mode === "chunked",
    createdAt: now,
    expiresAt: new Date(Date.parse(now) + 60 * 60 * 1000).toISOString(),
  };
  const uploadAsset: UploadAsset = {
    ...selectedAsset,
    assetId,
    url: buildUploadedAssetUrl(assetId, requestUrl),
    metadata: {
      ...selectedAsset.metadata,
      checksum: transfer.fileChecksum,
      checksumAlgorithm: transfer.checksumAlgorithm,
    },
    ...(selectedAsset.fileType === "image" || selectedAsset.fileType === "avatar"
      ? { thumbnailUrl: buildUploadedThumbnailUrl(assetId, requestUrl) }
      : {}),
  };

  task.taskId = taskId;
  task.stage = "uploading";
  task.chunkingReserved = false;
  task.transferMode = transfer.mode;
  task.sessionId = sessionId;
  task.chunkCount = transfer.chunks.length;
  task.integrity = {
    checksumAlgorithm: transfer.checksumAlgorithm,
    fileChecksum: transfer.fileChecksum,
    expectedSizeBytes: transfer.totalBytes,
  };
  task.reviewStatus = "not_required";
  task.reviewMessage = "Upload session created. Transfer chunks to continue.";
  updateUploadTaskProgress(task, 0, transfer.totalBytes, 0);
  task.lifecycle = createUploadLifecycle(task, {
    backendBacked: true,
    canRetry: false,
    canCancel: true,
    lastTransitionAt: now,
    ...(expiresAt ? { expiresAt } : {}),
  });

  return {
    source: "backend_session",
    selection: {
      ...selection,
      uploadTask: cloneUploadTask(task),
      uploadAsset,
      transfer: cloneUploadTransferPayload(transfer),
    },
    uploadTask: task,
    uploadAsset,
    transfer,
    session,
    reviewRecord: {
      status: "not_required",
      provider: "sample-upload-policy",
      message: "Upload session created.",
    },
    cleanupRecord: {
      retentionStatus: "active",
      referenced: false,
    },
    references: [],
    chunksByIndex: {},
    binaryByChunkIndex: {},
  };
}

export function appendUploadChunkRecord(
  existing: StoredUploadRecord,
  request: UploadChunkRequest,
  now = new Date().toISOString(),
): StoredUploadRecord {
  const record = cloneStoredUploadRecord(existing);
  if (!record.session || !record.transfer) {
    return createUploadErrorRecord(record.selection, "backend_chunk", "Upload session is unavailable for this task.", "UPLOAD_SESSION_NOT_FOUND", now);
  }
  if (record.uploadTask.taskId !== request.taskId || record.session.sessionId !== request.sessionId) {
    return createUploadErrorRecord(record.selection, "backend_chunk", "Upload session identifiers do not match the active task.", "UPLOAD_SESSION_MISMATCH", now);
  }
  const expectedChunk = record.transfer.chunks[request.chunk.chunkIndex];
  if (!expectedChunk) {
    return createUploadErrorRecord(record.selection, "backend_chunk", "Upload chunk index is out of range.", "UPLOAD_CHUNK_RANGE", now);
  }
  const chunkBytes = decodeBase64ToBuffer(request.chunk.dataBase64);
  const chunkChecksum = createUploadHash(chunkBytes);
  if (chunkChecksum !== request.chunk.checksum || chunkChecksum !== expectedChunk.checksum) {
    return createUploadErrorRecord(record.selection, "backend_chunk", "Upload chunk checksum verification failed.", "UPLOAD_CHECKSUM_MISMATCH", now);
  }
  if (chunkBytes.byteLength !== expectedChunk.byteLength || request.chunk.byteOffset !== expectedChunk.byteOffset) {
    return createUploadErrorRecord(record.selection, "backend_chunk", "Upload chunk metadata did not match the prepared manifest.", "UPLOAD_CHUNK_INVALID", now);
  }

  const receipt: UploadChunkReceipt = {
    chunkIndex: request.chunk.chunkIndex,
    byteOffset: request.chunk.byteOffset,
    byteLength: request.chunk.byteLength,
    checksum: request.chunk.checksum,
    checksumAlgorithm: request.chunk.checksumAlgorithm,
    receivedAt: now,
  };
  record.chunksByIndex[String(receipt.chunkIndex)] = receipt;
  record.binaryByChunkIndex[String(receipt.chunkIndex)] = request.chunk.dataBase64;
  record.receivedChunk = receipt;
  record.source = "backend_chunk";
  record.uploadTask.stage = "uploading";
  record.uploadTask.reviewStatus = "not_required";
  record.uploadTask.reviewMessage = `Chunk ${receipt.chunkIndex + 1} uploaded.`;
  const uploadedChunkCount = Object.keys(record.chunksByIndex).length;
  const completedBytes = Object.values(record.chunksByIndex).reduce((sum, item) => sum + item.byteLength, 0);
  updateUploadTaskProgress(record.uploadTask, completedBytes, record.transfer.totalBytes, uploadedChunkCount);
  record.uploadTask.lifecycle = createUploadLifecycle(record.uploadTask, {
    backendBacked: true,
    retryCount: record.uploadTask.lifecycle.retryCount,
    canRetry: false,
    canCancel: true,
    lastTransitionAt: now,
    ...(record.uploadTask.lifecycle.expiresAt ? { expiresAt: record.uploadTask.lifecycle.expiresAt } : {}),
  });
  record.session.receivedChunkCount = uploadedChunkCount;
  record.session.nextChunkIndex =
    record.transfer.chunks.find((chunk) => !record.chunksByIndex[String(chunk.chunkIndex)])?.chunkIndex ?? record.transfer.chunks.length;
  record.reviewRecord = {
    status: "not_required",
    provider: "sample-upload-policy",
    message: `${uploadedChunkCount}/${record.transfer.chunks.length} chunks uploaded.`,
  };
  return record;
}

export function completeUploadRecord(
  existing: StoredUploadRecord,
  request: { taskId: string; sessionId: string; fileChecksum: string; checksumAlgorithm: "sha256" },
  requestUrl: string,
  now = new Date().toISOString(),
): StoredUploadRecord {
  const record = cloneStoredUploadRecord(existing);
  if (!record.session || !record.transfer || !record.uploadAsset) {
    return createUploadErrorRecord(record.selection, "backend_complete", "Upload session is unavailable for completion.", "UPLOAD_SESSION_NOT_FOUND", now);
  }
  if (record.uploadTask.taskId !== request.taskId || record.session.sessionId !== request.sessionId) {
    return createUploadErrorRecord(record.selection, "backend_complete", "Upload session identifiers do not match the active task.", "UPLOAD_SESSION_MISMATCH", now);
  }
  const missingChunk = record.transfer.chunks.find((chunk) => !record.chunksByIndex[String(chunk.chunkIndex)]);
  if (missingChunk) {
    return createUploadErrorRecord(record.selection, "backend_complete", "Upload completion requires every chunk to be transferred first.", "UPLOAD_INCOMPLETE", now);
  }

  const buffers = record.transfer.chunks.map((chunk) =>
    decodeBase64ToBuffer(record.binaryByChunkIndex[String(chunk.chunkIndex)] ?? ""),
  );
  const merged = Buffer.concat(buffers.map((buffer) => Buffer.from(buffer)));
  const fileChecksum = createUploadHash(merged);
  if (fileChecksum !== request.fileChecksum || fileChecksum !== record.transfer.fileChecksum) {
    return createUploadErrorRecord(record.selection, "backend_complete", "Upload file checksum verification failed.", "UPLOAD_CHECKSUM_MISMATCH", now);
  }

  record.binaryObjectKey = record.session.objectKey;
  record.uploadAsset = {
    ...record.uploadAsset,
    url: buildUploadedAssetUrl(record.uploadAsset.assetId, requestUrl),
    ...(record.uploadAsset.fileType === "image" || record.uploadAsset.fileType === "avatar"
      ? { thumbnailUrl: buildUploadedThumbnailUrl(record.uploadAsset.assetId, requestUrl) }
      : {}),
    metadata: {
      ...record.uploadAsset.metadata,
      sizeBytes: merged.byteLength,
      checksum: fileChecksum,
      checksumAlgorithm: request.checksumAlgorithm,
    },
  };

  const rejectedByPolicy = /blocked|reject|sensitive/i.test(record.uploadTask.fileName ?? record.uploadAsset.fileName);
  const requiresReview = record.uploadTask.governance.sensitiveReviewRequired;
  record.source = "backend_complete";
  updateUploadTaskProgress(record.uploadTask, merged.byteLength, merged.byteLength, record.transfer.chunks.length);
  if (rejectedByPolicy) {
    record.uploadTask.stage = "failed";
    record.uploadTask.reviewStatus = "rejected";
    record.uploadTask.reviewMessage = "The sample upload policy rejected this asset during review.";
    record.uploadTask.lifecycle = createUploadLifecycle(record.uploadTask, {
      backendBacked: true,
      retryCount: record.uploadTask.lifecycle.retryCount,
      canRetry: true,
      canCancel: false,
      lastTransitionAt: now,
      ...(record.uploadTask.lifecycle.expiresAt ? { expiresAt: record.uploadTask.lifecycle.expiresAt } : {}),
    });
    record.uploadError = {
      code: "UPLOAD_REVIEW_REJECTED",
      message: record.uploadTask.reviewMessage,
      recoverable: true,
      retryable: true,
      stage: "failed",
    };
    record.reviewRecord = {
      status: "rejected",
      provider: "sample-upload-policy",
      reviewedAt: now,
      message: record.uploadTask.reviewMessage,
      reasonCodes: ["blocked_filename"],
    };
    updateUploadRetention(record, {
      retentionStatus: "scheduled_cleanup",
      cleanupScheduledAt: now,
      cleanupReason: "review_rejected",
      referenced: record.references.length > 0,
    });
    return record;
  }

  delete record.uploadError;
  record.uploadTask.reviewStatus = requiresReview ? "pending" : "approved";
  record.uploadTask.stage = requiresReview ? "reviewing" : "completed";
  record.uploadTask.reviewMessage = requiresReview
    ? "Sensitive review is pending in the upload pipeline."
    : "The asset cleared validation and is ready for downstream business use.";
  record.uploadTask.lifecycle = createUploadLifecycle(record.uploadTask, {
    backendBacked: true,
    retryCount: record.uploadTask.lifecycle.retryCount,
    canRetry: false,
    canCancel: requiresReview,
    lastTransitionAt: now,
    ...(record.uploadTask.lifecycle.expiresAt ? { expiresAt: record.uploadTask.lifecycle.expiresAt } : {}),
  });
  record.reviewRecord = {
    status: requiresReview ? "pending" : "approved",
    provider: "sample-upload-policy",
    ...(requiresReview ? {} : { reviewedAt: now }),
    message: record.uploadTask.reviewMessage,
  };
  updateUploadRetention(record, {
    retentionStatus: "active",
    referenced: record.references.length > 0,
  });
  return record;
}

export function attachUploadRecord(
  existing: StoredUploadRecord,
  request: UploadAttachRequest,
  now = new Date().toISOString(),
): StoredUploadRecord {
  const record = cloneStoredUploadRecord(existing);
  const reference: UploadReference = {
    ownerType: request.reference.ownerType,
    ownerId: request.reference.ownerId,
    role: request.reference.role,
    attachedAt: now,
  };
  const duplicate = record.references.find(
    (item) => item.ownerType === reference.ownerType && item.ownerId === reference.ownerId && item.role === reference.role,
  );
  if (!duplicate) {
    record.references = [...record.references, reference];
  }
  record.source = "backend_attach";
  updateUploadRetention(record, {
    retentionStatus: "active",
    referenced: true,
  });
  return record;
}

export function createUploadPipelineResponse(
  request: UploadPipelineRequest,
  requestUrl: string,
  now = new Date().toISOString(),
): UploadPipelineResponse {
  let record = createUploadSessionRecord(request, requestUrl, undefined, now);
  const initialTransfer = record.transfer;
  const initialSession = record.session;
  if (!initialTransfer || record.uploadError || !initialSession) {
    return createUploadResponse(record);
  }
  for (const chunk of initialTransfer.chunks) {
    record = appendUploadChunkRecord(
      record,
      {
        taskId: record.uploadTask.taskId,
        sessionId: initialSession.sessionId,
        chunk,
      },
      now,
    );
    if (record.uploadError) {
      return createUploadResponse(record);
    }
  }
  return createUploadResponse(
    completeUploadRecord(
      record,
      {
        taskId: record.uploadTask.taskId,
        sessionId: initialSession.sessionId,
        fileChecksum: initialTransfer.fileChecksum,
        checksumAlgorithm: initialTransfer.checksumAlgorithm,
      },
      requestUrl,
      now,
    ),
  );
}

export function retryUploadPipeline(
  existing: StoredUploadRecord,
  _request: UploadRetryRequest,
  now = new Date().toISOString(),
): StoredUploadRecord {
  const record = cloneStoredUploadRecord(existing);
  record.source = "backend_retry";
  if (!record.session && record.transfer) {
    record.session = {
      sessionId: `us_${crypto.randomUUID()}`,
      uploadToken: `ut_${crypto.randomUUID()}`,
      objectKey: record.binaryObjectKey ?? `object/${record.uploadAsset?.assetId ?? crypto.randomUUID()}/${crypto.randomUUID()}`,
      mode: record.transfer.mode,
      checksumAlgorithm: record.transfer.checksumAlgorithm,
      chunkSizeBytes: record.transfer.chunkSizeBytes,
      chunkCount: record.transfer.chunks.length,
      receivedChunkCount: Object.keys(record.chunksByIndex).length,
      nextChunkIndex:
        record.transfer.chunks.find((chunk) => !record.chunksByIndex[String(chunk.chunkIndex)])?.chunkIndex ?? record.transfer.chunks.length,
      resumeSupported: record.transfer.mode === "chunked",
      createdAt: now,
      expiresAt: new Date(Date.parse(now) + 60 * 60 * 1000).toISOString(),
    };
  } else if (record.session) {
    record.session = {
      ...record.session,
      receivedChunkCount: Object.keys(record.chunksByIndex).length,
      nextChunkIndex:
        record.transfer?.chunks.find((chunk) => !record.chunksByIndex[String(chunk.chunkIndex)])?.chunkIndex ??
        record.session.chunkCount,
      expiresAt: new Date(Date.parse(now) + 60 * 60 * 1000).toISOString(),
    };
  }
  record.uploadTask.stage = "uploading";
  record.uploadTask.reviewStatus = "not_required";
  record.uploadTask.reviewMessage = "Upload retry prepared. Resume remaining chunks.";
  record.uploadTask.lifecycle = createUploadLifecycle(record.uploadTask, {
    backendBacked: true,
    retryCount: record.uploadTask.lifecycle.retryCount + 1,
    canRetry: false,
    canCancel: true,
    lastTransitionAt: now,
    ...(record.uploadTask.lifecycle.expiresAt ? { expiresAt: record.uploadTask.lifecycle.expiresAt } : {}),
  });
  delete record.uploadError;
  record.reviewRecord = {
    status: "not_required",
    provider: "sample-upload-policy",
    message: "Upload retry prepared.",
  };
  return record;
}

export function cancelUploadPipeline(
  existing: StoredUploadRecord,
  request: UploadCancelRequest,
  now = new Date().toISOString(),
): StoredUploadRecord {
  const record = cloneStoredUploadRecord(existing);
  record.source = "backend_cancel";
  record.uploadTask.stage = "canceled";
  record.uploadTask.reviewMessage = request.reason ? `Upload cancelled: ${request.reason}.` : "Upload cancelled.";
  record.uploadTask.lifecycle = createUploadLifecycle(record.uploadTask, {
    backendBacked: true,
    retryCount: record.uploadTask.lifecycle.retryCount,
    canRetry: true,
    canCancel: false,
    lastTransitionAt: now,
    ...(record.uploadTask.lifecycle.expiresAt ? { expiresAt: record.uploadTask.lifecycle.expiresAt } : {}),
  });
  record.uploadError = {
    code: "UPLOAD_CANCELLED",
    message: record.uploadTask.reviewMessage,
    recoverable: true,
    retryable: true,
    stage: "canceled",
  };
  record.reviewRecord = {
    status: record.uploadTask.reviewStatus,
    provider: "sample-upload-policy",
    message: record.uploadTask.reviewMessage,
  };
  updateUploadRetention(record, {
    retentionStatus: "scheduled_cleanup",
    cleanupScheduledAt: now,
    cleanupReason: "user_cancelled",
    referenced: record.references.length > 0,
  });
  return record;
}

export function findUploadRecordByAssetId(userState: UserState, assetId: string): StoredUploadRecord | undefined {
  return Object.values(userState.uploadsByTaskId).find((record) => record.uploadAsset?.assetId === assetId);
}

export function resolveUploadAssetForUser(userState: UserState, assetId: string): UploadAsset | undefined {
  return findUploadRecordByAssetId(userState, assetId)?.uploadAsset;
}

export function readUploadedAssetBinary(userState: UserState, assetId: string): { contentType: string; body: Uint8Array } | undefined {
  const record = findUploadRecordByAssetId(userState, assetId);
  if (!record?.transfer || !record.uploadAsset) {
    return undefined;
  }
  const buffers = record.transfer.chunks
    .map((chunk) => record.binaryByChunkIndex[String(chunk.chunkIndex)])
    .filter((value): value is string => typeof value === "string")
    .map(decodeBase64ToBuffer);
  if (buffers.length === 0) {
    return undefined;
  }
  return {
    contentType: record.uploadAsset.metadata.mimeType ?? "application/octet-stream",
    body: Uint8Array.from(Buffer.concat(buffers.map((buffer) => Buffer.from(buffer)))),
  };
}

export function bindUploadAssetsToOwner(
  userState: UserState,
  input: {
    assetIds: string[];
    ownerType: UploadAttachRequest["reference"]["ownerType"];
    ownerId: string;
    role: string;
    now?: string;
  },
) {
  const now = input.now ?? new Date().toISOString();
  for (const assetId of input.assetIds) {
    const record = findUploadRecordByAssetId(userState, assetId);
    if (!record) {
      continue;
    }
    const next = attachUploadRecord(
      record,
      {
        assetId,
        reference: {
          ownerType: input.ownerType,
          ownerId: input.ownerId,
          role: input.role,
        },
      },
      now,
    );
    userState.uploadsByTaskId[next.uploadTask.taskId] = next;
  }
}

export function createMembershipOverview(
  planId?: PurchaseMembershipRequest["planId"],
): MembershipOverview {
  if (!planId) {
    return DEFAULT_MEMBERSHIP_OVERVIEW;
  }

  return {
    active: true,
    tier: "member",
    entitlementScope: "membership",
    statusLabel: "Membership active with premium reading unlocked",
    renewalLabel: MEMBER_RENEWAL_LABELS[planId],
    headline: "Membership Active",
    subheadline:
      "Premium reading is now unlocked. You can return to the blocked title and keep going without losing context.",
    benefits: DEFAULT_MEMBERSHIP_OVERVIEW.benefits,
  };
}

const PAYMENT_PRODUCTS: PaymentProduct[] = [
  {
    productId: "membership_access",
    productType: "membership",
    title: "Membership Access",
    summary: "Recurring membership packages that unlock premium reading and bundled benefits.",
    active: true,
    defaultSkuId: "membership_quarterly",
    fulfillmentLabel: "Membership entitlement",
    tagLabels: ["membership", "premium"],
  },
  {
    productId: "chapter_unlock_pack",
    productType: "one_time",
    title: "Chapter Unlock Pack",
    summary: "One-time virtual unlock for a premium chapter or title-bound entitlement.",
    active: true,
    defaultSkuId: "chapter_unlock_single",
    fulfillmentLabel: "Single-use chapter entitlement",
    tagLabels: ["virtual", "chapter"],
  },
  {
    productId: "study_club_plus",
    productType: "subscription",
    title: "Study Club Plus",
    summary: "Auto-renewing subscription for premium consultation slots and discussion archives.",
    active: true,
    defaultSkuId: "study_club_plus_monthly",
    fulfillmentLabel: "Recurring subscription entitlement",
    tagLabels: ["subscription", "consultation"],
  },
  {
    productId: "priority_service_pack",
    productType: "value_added",
    title: "Priority Service Pack",
    summary: "Value-added service pack for expedited review and support handling.",
    active: true,
    defaultSkuId: "priority_service_once",
    fulfillmentLabel: "Service entitlement",
    tagLabels: ["service", "priority"],
  },
];

const PAYMENT_SKUS: PaymentSku[] = [
  {
    skuId: "membership_monthly",
    productId: "membership_access",
    productType: "membership",
    title: "Monthly Membership",
    summary: "Monthly recurring membership access.",
    billingCycle: "monthly",
    autoRenew: true,
    amountCents: 1900,
    currency: "CNY",
    active: true,
    channelOptions: ["wechat_pay", "h5_pay", "membership_purchase"],
    entitlementKey: "membership:monthly",
    statusLabel: "Renews monthly",
  },
  {
    skuId: "membership_quarterly",
    productId: "membership_access",
    productType: "membership",
    title: "Quarterly Membership",
    summary: "Quarterly recurring membership access.",
    billingCycle: "quarterly",
    autoRenew: true,
    amountCents: 4900,
    currency: "CNY",
    active: true,
    channelOptions: ["wechat_pay", "h5_pay", "membership_purchase"],
    entitlementKey: "membership:quarterly",
    statusLabel: "Renews quarterly",
  },
  {
    skuId: "membership_annual",
    productId: "membership_access",
    productType: "membership",
    title: "Annual Membership",
    summary: "Annual recurring membership access.",
    billingCycle: "annual",
    autoRenew: true,
    amountCents: 15900,
    currency: "CNY",
    active: true,
    channelOptions: ["wechat_pay", "h5_pay", "membership_purchase"],
    entitlementKey: "membership:annual",
    statusLabel: "Renews annually",
  },
  {
    skuId: "chapter_unlock_single",
    productId: "chapter_unlock_pack",
    productType: "one_time",
    title: "Single Chapter Unlock",
    summary: "One-time unlock for a premium chapter.",
    billingCycle: "one_time",
    autoRenew: false,
    amountCents: 900,
    currency: "CNY",
    active: true,
    channelOptions: ["wechat_pay", "h5_pay", "virtual_entitlement"],
    entitlementKey: "chapter:single_unlock",
    statusLabel: "One-time fulfillment",
  },
  {
    skuId: "study_club_plus_monthly",
    productId: "study_club_plus",
    productType: "subscription",
    title: "Study Club Plus Monthly",
    summary: "Monthly recurring subscription for premium study club access.",
    billingCycle: "monthly",
    autoRenew: true,
    amountCents: 2900,
    currency: "CNY",
    active: true,
    channelOptions: ["wechat_pay", "h5_pay"],
    entitlementKey: "subscription:study_club_plus",
    statusLabel: "Auto-renews monthly",
  },
  {
    skuId: "priority_service_once",
    productId: "priority_service_pack",
    productType: "value_added",
    title: "Priority Service Pack",
    summary: "One-time value-added service for priority support and review.",
    billingCycle: "one_time",
    autoRenew: false,
    amountCents: 5900,
    currency: "CNY",
    active: true,
    channelOptions: ["wechat_pay", "h5_pay"],
    entitlementKey: "service:priority_pack",
    statusLabel: "One-time service fulfillment",
  },
];

const PAYMENT_PRODUCT_BY_ID = new Map(PAYMENT_PRODUCTS.map((product) => [product.productId, product] as const));
const PAYMENT_SKU_BY_ID = new Map(PAYMENT_SKUS.map((sku) => [sku.skuId, sku] as const));
const MEMBERSHIP_PLAN_SKU_IDS: Record<PurchaseMembershipRequest["planId"], string> = {
  monthly: "membership_monthly",
  quarterly: "membership_quarterly",
  annual: "membership_annual",
};

function clonePaymentProduct(product: PaymentProduct): PaymentProduct {
  return {
    ...product,
    tagLabels: [...product.tagLabels],
  };
}

function clonePaymentSku(sku: PaymentSku): PaymentSku {
  return {
    ...sku,
    channelOptions: [...sku.channelOptions],
  };
}

export function createPaymentCatalogResponse(): PaymentCatalogResponse {
  return {
    products: PAYMENT_PRODUCTS.map((product) => clonePaymentProduct(product)),
    skus: PAYMENT_SKUS.map((sku) => clonePaymentSku(sku)),
  };
}

function getPaymentSku(skuId: string): PaymentSku | undefined {
  const sku = PAYMENT_SKU_BY_ID.get(skuId);
  return sku ? clonePaymentSku(sku) : undefined;
}

function getPaymentProduct(productId: string): PaymentProduct | undefined {
  const product = PAYMENT_PRODUCT_BY_ID.get(productId);
  return product ? clonePaymentProduct(product) : undefined;
}

function resolveMembershipSku(planId: PurchaseMembershipRequest["planId"]): PaymentSku {
  return clonePaymentSku(PAYMENT_SKU_BY_ID.get(MEMBERSHIP_PLAN_SKU_IDS[planId])!);
}

function createRenewalDate(now: string, billingCycle: ProductBillingCycle): string | undefined {
  const timestamp = Date.parse(now);
  if (billingCycle === "monthly") {
    return new Date(timestamp + 30 * 24 * 60 * 60 * 1000).toISOString();
  }
  if (billingCycle === "quarterly") {
    return new Date(timestamp + 90 * 24 * 60 * 60 * 1000).toISOString();
  }
  if (billingCycle === "annual") {
    return new Date(timestamp + 365 * 24 * 60 * 60 * 1000).toISOString();
  }
  return undefined;
}

function createPaymentChannel(channel: PaymentChannel | undefined, platform: SessionRecord["platform"]): PaymentChannel {
  if (channel) {
    return channel;
  }

  return platform === "wechat" ? "wechat_pay" : "h5_pay";
}

function createGenericEntitlement(
  sku: PaymentSku,
  orderId: string,
  active: boolean,
  statusLabel: string,
  now?: string,
): PurchaseOrderResponse["entitlement"] {
  return {
    entitlementId: `ent_${sku.skuId}_${orderId}`,
    productType: sku.productType,
    active,
    statusLabel,
    sourceOrderId: orderId,
  };
}

function createMembershipEntitlement(
  planId: PurchaseMembershipRequest["planId"],
  orderId: string,
): MembershipEntitlement {
  const overview = createMembershipOverview(planId);
  return {
    entitlementId: `ent_membership_${orderId}`,
    productType: "membership",
    active: true,
    statusLabel: overview.statusLabel,
    sourceOrderId: orderId,
    overview,
  };
}

function createSubscriptionRecord(input: {
  sku: PaymentSku;
  orderId: string;
  entitlementId?: string;
  now: string;
  status: SubscriptionStatus;
}): SubscriptionRecord {
  const renewsAt = createRenewalDate(input.now, input.sku.billingCycle);
  return {
    subscriptionId: `sub_${input.sku.skuId}_${input.orderId}`,
    productId: input.sku.productId,
    skuId: input.sku.skuId,
    title: input.sku.title,
    productType: input.sku.productType as SubscriptionRecord["productType"],
    status: input.status,
    statusLabel:
      input.status === "pending_activation"
        ? "Pending activation after payment confirmation"
        : input.sku.autoRenew
          ? input.sku.statusLabel
          : "Active until the current term ends",
    autoRenew: input.sku.autoRenew,
    startedAt: input.now,
    ...(renewsAt ? { renewsAt } : {}),
    latestOrderId: input.orderId,
    ...(input.entitlementId ? { entitlementId: input.entitlementId } : {}),
  };
}

function createPendingCallbackVerification(): PaymentCallbackVerification {
  return {
    status: "pending",
    message: "The sample gateway callback has not been verified yet.",
  };
}

function createPendingReconciliation(): PaymentReconciliation {
  return {
    status: "pending",
    message: "The sample order has not been reconciled yet.",
  };
}

function createPaymentProviderMode(payload: PurchaseMembershipRequest): PaymentProviderMode {
  return payload.providerMode ?? "sample";
}

function createPaymentGatewayProvider(channel: PaymentChannel, providerMode: PaymentProviderMode): PaymentGatewayProvider {
  if (providerMode === "sample") {
    return "sample";
  }

  return channel === "wechat_pay" ? "wechat_pay" : "h5_gateway";
}

function createGatewayExecution(input: {
  order: Order;
  providerMode: PaymentProviderMode;
  now: string;
}): {
  request: PaymentGatewayExecutionRequest;
  response: PaymentGatewayExecutionResponse;
} {
  const provider = createPaymentGatewayProvider(input.order.channel, input.providerMode);
  const timestamp = Date.parse(input.now);
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const gatewayOrderId = `${provider}_${input.order.orderId}`;
  const request: PaymentGatewayExecutionRequest = {
    provider,
    providerMode: input.providerMode,
    orderId: input.order.orderId,
    amountCents: input.order.totalAmountCents,
    currency: input.order.currency,
    notifyUrl: "/payments/callback",
    ...(input.order.source ? { returnUrl: `/${input.order.source}` } : {}),
  };
  const response: PaymentGatewayExecutionResponse = {
    provider,
    providerMode: input.providerMode,
    gatewayOrderId,
    ...(provider === "wechat_pay" ? { prepayId: `prepay_${input.order.orderId}` } : {}),
    ...(provider === "h5_gateway" ? { paymentUrl: `https://pay.minix.local/orders/${input.order.orderId}` } : {}),
    nonce,
    timestamp,
    signature: `sig_${provider}_${input.order.orderId}_${nonce.slice(0, 8)}`,
    expiresAt: new Date(timestamp + 15 * 60_000).toISOString(),
  };

  return { request, response };
}

function createPaymentLedgerEntry(input: {
  kind: PaymentLedgerEntry["kind"];
  order: Order;
  status: string;
  message: string;
  createdAt: string;
  gatewayReference?: PaymentLedgerEntry["gatewayReference"];
}): PaymentLedgerEntry {
  return {
    ledgerId: `ledger_${crypto.randomUUID()}`,
    kind: input.kind,
    orderId: input.order.orderId,
    amountCents: input.order.totalAmountCents,
    currency: input.order.currency,
    status: input.status,
    ...(input.gatewayReference ? { gatewayReference: input.gatewayReference } : {}),
    message: input.message,
    createdAt: input.createdAt,
  };
}

export function createPaymentOperationResult(input: {
  operation: PaymentOperationResult["operation"];
  applied: boolean;
  orderStatus: PaymentOperationResult["orderStatus"];
  paymentStatus: PaymentOperationResult["paymentStatus"];
  message: string;
  processedAt?: string;
}): PaymentOperationResult {
  return {
    operation: input.operation,
    applied: input.applied,
    orderStatus: input.orderStatus,
    paymentStatus: input.paymentStatus,
    message: input.message,
    processedAt: input.processedAt ?? new Date().toISOString(),
  };
}

export function createMembershipOrderDetail(
  session: SessionRecord,
  payload: PurchaseMembershipRequest,
  duplicateProtected = false,
  now = new Date().toISOString(),
): OrderDetailResponse & { entitlement: MembershipEntitlement } {
  const orderId = `ord_${crypto.randomUUID()}`;
  const sku = resolveMembershipSku(payload.planId);
  const product = getPaymentProduct(sku.productId)!;
  const amountCents = sku.amountCents;
  const title = sku.title;
  const channel = createPaymentChannel(payload.channel, session.platform);
  const providerMode = createPaymentProviderMode(payload);
  const pending = payload.paymentScenario === "pending";
  const order: Order = {
    orderId,
    title,
    status: pending ? "pending_payment" : "paid",
    productType: "membership",
    channel,
    currency: "CNY",
    totalAmountCents: amountCents,
    ...(payload.idempotencyKey ? { idempotencyKey: payload.idempotencyKey } : {}),
    duplicateProtected,
    ...(payload.source ? { source: payload.source } : {}),
    ...(payload.novelId ? { novelId: payload.novelId } : {}),
    ...(payload.chapterId ? { chapterId: payload.chapterId } : {}),
    createdAt: now,
    updatedAt: now,
    lineItems: [
      {
        productId: sku.productId,
        skuId: sku.skuId,
        productType: "membership",
        title,
        quantity: 1,
        unitAmountCents: amountCents,
        totalAmountCents: amountCents,
      },
    ],
  };
  const gatewayExecution = createGatewayExecution({ order, providerMode, now });
  const gatewayReference = {
    provider: gatewayExecution.response.provider,
    providerMode,
    gatewayOrderId: gatewayExecution.response.gatewayOrderId,
  };
  const paymentIntent: PaymentIntent = {
    intentId: `pi_${orderId}`,
    orderId,
    channel,
    status: pending ? "processing" : "succeeded",
    clientAction: session.platform === "wechat" ? "wechat_sdk" : "h5_redirect",
    clientPayload: {
      orderId,
      channel,
      provider: gatewayExecution.response.provider,
      providerMode,
      gatewayOrderId: gatewayExecution.response.gatewayOrderId,
      nonce: gatewayExecution.response.nonce,
      timestamp: gatewayExecution.response.timestamp,
      signature: gatewayExecution.response.signature,
      ...(gatewayExecution.response.prepayId ? { prepayId: gatewayExecution.response.prepayId } : {}),
      ...(gatewayExecution.response.paymentUrl ? { paymentUrl: gatewayExecution.response.paymentUrl } : {}),
    },
    gatewayReference,
    gatewayRequest: gatewayExecution.request,
    gatewayResponse: gatewayExecution.response,
    expiresAt: now,
  };
  const paymentResult: PaymentResult = {
    orderId,
    status: pending ? "pending" : "success",
    paid: !pending,
    duplicateProtected,
    callbackVerified: false,
    message: pending
      ? "Payment is pending gateway confirmation in the sample payment domain."
      : duplicateProtected
        ? "Duplicate payment protection kept the active entitlement and returned the existing paid outcome."
        : "Payment completed in the sample payment domain.",
    ...(pending ? {} : { polledAt: now }),
  };
  const entitlement = createMembershipEntitlement(payload.planId, orderId);
  const subscription = createSubscriptionRecord({
    sku,
    orderId,
    entitlementId: entitlement.entitlementId,
    now,
    status: pending ? "pending_activation" : "active",
  });
  if (pending) {
    entitlement.active = false;
    entitlement.statusLabel = "Pending payment confirmation";
    entitlement.overview = {
      ...entitlement.overview,
      active: false,
      tier: "signed-in",
      entitlementScope: "none",
      statusLabel: "Payment pending",
      headline: "Awaiting Payment",
      subheadline: "The order is created but membership is not active until the callback is verified.",
    };
  }

  return {
    order,
    product,
    sku,
    paymentIntent,
    paymentResult,
    callbackVerification: createPendingCallbackVerification(),
    reconciliation: createPendingReconciliation(),
    paymentLedger: [
      createPaymentLedgerEntry({
        kind: "payment",
        order,
        status: paymentResult.status,
        message: paymentResult.message,
        createdAt: now,
        gatewayReference,
      }),
    ],
    operationLedger: [],
    callbackLedger: [],
    reconciliationLedger: [
      {
        reconciliationId: `recon_${crypto.randomUUID()}`,
        orderId,
        status: "pending",
        gatewayReference,
        message: "Initial reconciliation is pending gateway callback or explicit reconciliation.",
        checkedAt: now,
      } satisfies PaymentReconciliationLedgerEntry,
    ],
    entitlement,
    subscription,
    afterSalesCases: [],
  };
}

export function createProductOrderDetail(
  session: SessionRecord,
  payload: PurchaseOrderRequest,
  duplicateProtected = false,
  now = new Date().toISOString(),
): OrderDetailResponse | null {
  const sku = getPaymentSku(payload.skuId);
  if (!sku) {
    return null;
  }
  const product = getPaymentProduct(sku.productId);
  if (!product) {
    return null;
  }

  const orderId = `ord_${crypto.randomUUID()}`;
  const channel = createPaymentChannel(payload.channel, session.platform);
  const providerMode = payload.providerMode ?? "sample";
  const pending = payload.paymentScenario === "pending";
  const order: Order = {
    orderId,
    title: sku.title,
    status: pending ? "pending_payment" : "paid",
    productType: sku.productType,
    channel,
    currency: sku.currency,
    totalAmountCents: sku.amountCents,
    ...(payload.idempotencyKey ? { idempotencyKey: payload.idempotencyKey } : {}),
    duplicateProtected,
    ...(payload.source ? { source: payload.source } : {}),
    ...(payload.novelId ? { novelId: payload.novelId } : {}),
    ...(payload.chapterId ? { chapterId: payload.chapterId } : {}),
    createdAt: now,
    updatedAt: now,
    lineItems: [
      {
        productId: sku.productId,
        skuId: sku.skuId,
        productType: sku.productType,
        title: sku.title,
        quantity: 1,
        unitAmountCents: sku.amountCents,
        totalAmountCents: sku.amountCents,
      },
    ],
  };
  const gatewayExecution = createGatewayExecution({ order, providerMode, now });
  const gatewayReference = {
    provider: gatewayExecution.response.provider,
    providerMode,
    gatewayOrderId: gatewayExecution.response.gatewayOrderId,
  };
  const paymentIntent: PaymentIntent = {
    intentId: `pi_${orderId}`,
    orderId,
    channel,
    status: pending ? "processing" : "succeeded",
    clientAction: session.platform === "wechat" ? "wechat_sdk" : "h5_redirect",
    clientPayload: {
      orderId,
      channel,
      provider: gatewayExecution.response.provider,
      providerMode,
      gatewayOrderId: gatewayExecution.response.gatewayOrderId,
      nonce: gatewayExecution.response.nonce,
      timestamp: gatewayExecution.response.timestamp,
      signature: gatewayExecution.response.signature,
      ...(gatewayExecution.response.prepayId ? { prepayId: gatewayExecution.response.prepayId } : {}),
      ...(gatewayExecution.response.paymentUrl ? { paymentUrl: gatewayExecution.response.paymentUrl } : {}),
    },
    gatewayReference,
    gatewayRequest: gatewayExecution.request,
    gatewayResponse: gatewayExecution.response,
    expiresAt: now,
  };
  const paymentResult: PaymentResult = {
    orderId,
    status: pending ? "pending" : "success",
    paid: !pending,
    duplicateProtected,
    callbackVerified: false,
    message: pending
      ? `${sku.title} is pending gateway confirmation in the sample payment domain.`
      : duplicateProtected
        ? `Duplicate payment protection returned the existing ${sku.title} outcome.`
        : `${sku.title} completed in the sample payment domain.`,
    ...(pending ? {} : { polledAt: now }),
  };
  const entitlement =
    sku.productType === "membership"
      ? undefined
      : createGenericEntitlement(
          sku,
          orderId,
          !pending,
          pending ? "Pending payment confirmation" : `${sku.title} fulfilled`,
          now,
        );
  const subscription =
    sku.productType === "subscription"
      ? createSubscriptionRecord({
          sku,
          orderId,
          now,
          status: pending ? "pending_activation" : "active",
          ...(entitlement?.entitlementId ? { entitlementId: entitlement.entitlementId } : {}),
        })
      : undefined;

  return {
    order,
    product,
    sku,
    paymentIntent,
    paymentResult,
    callbackVerification: createPendingCallbackVerification(),
    reconciliation: createPendingReconciliation(),
    paymentLedger: [
      createPaymentLedgerEntry({
        kind: "payment",
        order,
        status: paymentResult.status,
        message: paymentResult.message,
        createdAt: now,
        gatewayReference,
      }),
    ],
    operationLedger: [],
    callbackLedger: [],
    reconciliationLedger: [
      {
        reconciliationId: `recon_${crypto.randomUUID()}`,
        orderId,
        status: "pending",
        gatewayReference,
        message: "Initial reconciliation is pending gateway callback or explicit reconciliation.",
        checkedAt: now,
      } satisfies PaymentReconciliationLedgerEntry,
    ],
    ...(entitlement ? { entitlement } : {}),
    ...(subscription ? { subscription } : {}),
    afterSalesCases: [],
  };
}

export function createMembershipPurchaseResponse(
  detail: OrderDetailResponse & { entitlement: MembershipEntitlement },
  payload: PurchaseMembershipRequest,
): PurchaseMembershipResponse {
  return {
    purchased: true,
    overview: detail.entitlement.overview,
    order: detail.order,
    paymentIntent: detail.paymentIntent,
    paymentResult: detail.paymentResult,
    ...(detail.operationResult ? { operationResult: detail.operationResult } : {}),
    entitlement: detail.entitlement,
    returnTarget: deriveReturnTarget(payload.source),
    ...(payload.source ? { source: payload.source } : {}),
    ...(payload.novelId ? { novelId: payload.novelId } : {}),
    ...(payload.chapterId ? { chapterId: payload.chapterId } : {}),
  };
}

function createOrderSummary(detail: OrderDetailResponse): OrderSummary {
  return {
    orderId: detail.order.orderId,
    title: detail.order.title,
    status: detail.order.status,
    productType: detail.order.productType,
    ...(detail.sku?.skuId ? { skuId: detail.sku.skuId } : {}),
    currency: detail.order.currency,
    totalAmountCents: detail.order.totalAmountCents,
    ...(detail.order.source ? { source: detail.order.source } : {}),
    createdAt: detail.order.createdAt,
    updatedAt: detail.order.updatedAt,
  };
}

export function listOrders(userState: UserState, request: ListOrdersRequest = {}): OrderListResponse {
  const page = Math.max(1, request.page ?? 1);
  const pageSize = Math.max(1, Math.min(request.pageSize ?? 20, 100));
  const filtered = Object.values(userState.ordersById)
    .filter((detail) => !request.status || detail.order.status === request.status)
    .filter((detail) => !request.productType || detail.order.productType === request.productType)
    .sort((left, right) => right.order.updatedAt.localeCompare(left.order.updatedAt));
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize).map((detail) => createOrderSummary(detail));
  const orderList: OrderList = {
    items,
    total: filtered.length,
    page,
    pageSize,
    hasMore: start + pageSize < filtered.length,
    ...(items[0]?.orderId ? { selectedOrderId: items[0].orderId } : {}),
  };
  return { orderList };
}

function resolveSubscriptionLifecycle(subscription: SubscriptionRecord, now = new Date().toISOString()): SubscriptionRecord {
  if (subscription.status === "cancelled" && subscription.graceEndsAt) {
    if (subscription.graceEndsAt < now) {
      return {
        ...subscription,
        status: "expired",
        statusLabel: "Expired after cancellation grace period",
        expiresAt: subscription.graceEndsAt,
      };
    }
    return {
      ...subscription,
      status: "grace",
      statusLabel: "Grace period active until the current term ends",
    };
  }

  if (subscription.status === "active" && subscription.renewsAt && subscription.renewsAt < now) {
    return {
      ...subscription,
      status: "renewal_due",
      statusLabel: "Renewal is due for the next term",
    };
  }

  return subscription;
}

export function listSubscriptions(userState: UserState): SubscriptionListResponse {
  const latestById = new Map<string, SubscriptionRecord>();
  for (const detail of Object.values(userState.ordersById)) {
    if (!detail.subscription) {
      continue;
    }
    const existing = latestById.get(detail.subscription.subscriptionId);
    if (!existing || existing.latestOrderId !== detail.subscription.latestOrderId) {
      latestById.set(detail.subscription.subscriptionId, resolveSubscriptionLifecycle(detail.subscription));
    }
  }
  const subscriptions = Array.from(latestById.values()).sort((left, right) =>
    (right.renewsAt ?? right.startedAt ?? right.latestOrderId).localeCompare(left.renewsAt ?? left.startedAt ?? left.latestOrderId),
  );
  return {
    subscriptions,
    ...(subscriptions[0]?.subscriptionId ? { selectedSubscriptionId: subscriptions[0].subscriptionId } : {}),
  };
}

export function attachAfterSalesCase(detail: OrderDetailResponse, caseItem: AfterSalesCase): OrderDetailResponse {
  return {
    ...detail,
    afterSalesCases: [caseItem, ...(detail.afterSalesCases ?? [])],
  };
}

export function listAfterSalesCases(userState: UserState): AfterSalesListResponse {
  const cases = Object.values(userState.afterSalesById).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  return {
    cases,
    ...(cases[0]?.caseId ? { selectedCaseId: cases[0].caseId } : {}),
  };
}

export function getAfterSalesCaseDetail(userState: UserState, caseId: string): AfterSalesDetailResponse | null {
  const caseItem = userState.afterSalesById[caseId];
  if (!caseItem) {
    return null;
  }
  const orderDetail = userState.ordersById[caseItem.orderId];
  if (!orderDetail) {
    return null;
  }
  return {
    caseItem,
    order: orderDetail.order,
    ...(orderDetail.operationResult ? { operationResult: orderDetail.operationResult } : {}),
  };
}

export function createAfterSalesCaseRecord(input: {
  kind: AfterSalesCase["kind"];
  detail: OrderDetailResponse;
  reason?: string;
  processedAt: string;
}): AfterSalesCase {
  return {
    caseId: `as_${input.kind}_${crypto.randomUUID()}`,
    orderId: input.detail.order.orderId,
    kind: input.kind,
    status: "completed",
    title: input.kind === "refund" ? "Refund request" : "Cancellation request",
    resultLabel:
      input.kind === "refund"
        ? "Refund completed in sample after-sales flow"
        : "Pending order cancelled before settlement",
    ...(input.reason ? { reason: input.reason } : {}),
    ...(input.kind === "refund" ? { refundAmountCents: input.detail.order.totalAmountCents } : {}),
    createdAt: input.processedAt,
    updatedAt: input.processedAt,
    completedAt: input.processedAt,
  };
}

export function createCurrentUserResponse(
  session: SessionRecord,
  userState: UserState,
  requestUrl?: string,
): CurrentUserResponse {
  const assetState = deriveUserAssetSummary(userState);
  if (assetState.membershipPlanId) {
    userState.membershipPlanId = assetState.membershipPlanId;
  }
  const uploadedAvatarUrl = userState.profileOverrides?.avatarAssetId
    ? resolveUploadAssetForUser(userState, userState.profileOverrides.avatarAssetId)?.url
    : undefined;
  const avatarUrl = uploadedAvatarUrl ??
    (session.profile.avatarUrl && requestUrl ? resolveSampleMediaUrl(session.profile.avatarUrl, requestUrl) : session.profile.avatarUrl);
  const availability = resolveUserAvailability(session, userState);
  const relationTargets = createPrimaryRelationTarget(userState, availability);
  const relation = relationTargets[0];
  const relationRecords = Object.values(ensureRelationRecords(userState));
  const followingCount = relationRecords.filter((record) => record.following && !record.blocked).length;
  const followerCount = relationRecords.filter((record) => record.followedBy && !record.blocked).length;
  const friendCount = relationRecords.filter((record) => record.friend || record.friendState === "mutual").length;
  const blockedCount = relationRecords.filter((record) => record.blocked).length;
  const displayNickname = userState.profileOverrides?.nickname ?? session.profile.nickname;
  const region = userState.profileOverrides?.region ?? (session.platform === "wechat" ? "Shanghai, CN" : "Web session");
  const bio = userState.profileOverrides?.bio ?? "Sample user profile for shared account-domain integration.";
  const phoneBound = Boolean(userState.boundPhoneNumber || session.identity.phoneBound);
  const wechatBound = userState.wechatBoundOverride ?? Boolean(session.identity.wechatBound);
  const providerIdentities = createProviderIdentities(session, userState);

  return {
    userProfile: {
      nickname: displayNickname,
      ...(avatarUrl ? { avatarUrl } : {}),
      gender: "unknown",
      region,
      bio,
      tags: session.authStatus === "guest" ? ["guest", "trial"] : ["member-ready", "cross-host"],
    },
    accountSummary: {
      userId: session.userId,
      phoneBound,
      ...(phoneBound
        ? { phoneNumberMasked: resolveMaskedPhoneNumber(userState.boundPhoneNumber) ?? "138****0001" }
        : {}),
      wechatBound,
      providerIdentities,
      realNameStatus: session.identity.realNameVerified ? "verified" : "unverified",
      assets:
        session.authStatus === "guest"
          ? {
              points: 0,
              level: 1,
              membership: DEFAULT_MEMBERSHIP_OVERVIEW,
              entitlementLabels: ["basic-access"],
              balanceCents: 0,
              availableBalanceCents: 0,
              frozenBalanceCents: 0,
              activeEntitlements: [],
            }
          : assetState.summary,
      relations: {
        followingCount,
        followerCount,
        friendCount,
        blockedCount,
        ...(canExposeRemarkName(userState, relation) && relation?.remarkName
          ? { remarkName: relation.remarkName }
          : session.authStatus === "guest"
            ? { remarkName: "Guest session" }
            : {}),
      },
    },
    userStatus: {
      availability,
      enabled: availability === "enabled",
      frozen: availability === "frozen",
      cancellationInProgress: availability === "cancellation_pending",
      blacklisted: availability === "blacklisted",
      guest: session.authStatus === "guest",
      ...(userState.pendingCancellation ? { cancellationRequestedAt: userState.pendingCancellation.requestedAt } : {}),
      ...(userState.pendingCancellation ? { cancellationEffectiveAt: userState.pendingCancellation.effectiveAt } : {}),
      ...(userState.pendingCancellation ? { cancellationRevocableUntil: userState.pendingCancellation.revokeUntil } : {}),
    },
    identityWorkflows: {
      canUpgradeGuest: session.authStatus === "guest" || Boolean(session.identity.anonymous),
      canBindPhone:
        session.authStatus === "authenticated" &&
        Boolean(session.identity.wechatBound || session.platform === "wechat") &&
        !phoneBound,
      mergePending: Boolean(userState.pendingIdentityWorkflow),
      ...(userState.pendingIdentityWorkflow ? { pendingWorkflow: userState.pendingIdentityWorkflow } : {}),
      ...(userState.lastIdentityWorkflow ? { lastWorkflow: userState.lastIdentityWorkflow } : {}),
    },
    securityCenter: createSecurityCenter(userState),
    accountOperations: createAccountOperations(session, userState, availability),
    operationRecords: userState.operationRecords,
    relationTargets,
  };
}

export function createAccountOperationResponse(
  session: SessionRecord,
  userState: UserState,
  requestUrl: string | undefined,
  transitionMessage: string,
  operationRecord?: AccountOperationRecord,
) {
  const next = createCurrentUserResponse(session, userState, requestUrl);
  return {
    userProfile: next.userProfile,
    accountSummary: next.accountSummary,
    userStatus: next.userStatus,
    securityCenter: next.securityCenter,
    accountOperations: next.accountOperations,
    operationRecords: next.operationRecords,
    ...(operationRecord ? { operationRecord } : {}),
    transitionMessage,
  };
}

export function listUserAssetHistory(
  session: SessionRecord,
  userState: UserState,
  request: ListUserAssetHistoryRequest,
): UserAssetHistoryResponse {
  const current = createCurrentUserResponse(session, userState);
  const page = request.page ?? 1;
  const pageSize = request.pageSize ?? 20;
  const filteredEntries = (userState.assetLedgerEntries ?? [])
    .filter((entry) => (request.subject && request.subject !== "all" ? entry.subject === request.subject : true))
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const startIndex = (page - 1) * pageSize;

  return {
    accountSummary: current.accountSummary,
    ledgerEntries: filteredEntries.slice(startIndex, startIndex + pageSize),
    pagination: {
      page,
      pageSize,
      hasMore: startIndex + pageSize < filteredEntries.length,
      total: filteredEntries.length,
    },
  };
}

export function createSettingsResponse(
  session: SessionRecord,
  userState: UserState,
  deployEnv: string | undefined,
): SettingsResponse {
  const settingsState = resolveSettingsState(userState, deployEnv);
  const availability = resolveUserAvailability(session, userState);
  const phoneBound = Boolean(session.identity.phoneBound || userState.boundPhoneNumber);
  const wechatBound = userState.wechatBoundOverride ?? Boolean(session.identity.wechatBound);
  const providerCount = createProviderIdentities(session, userState).length;
  return {
    preferences: {
      ...settingsState.preferences,
      theme: session.platform === "wechat" ? "light" : settingsState.preferences.theme,
      account: {
        profileEntryLabel: "Edit profile",
        phoneEntryLabel: phoneBound ? "Change phone" : "Bind phone",
        unbindEntryLabel: wechatBound ? "Unbind WeChat" : "Bind WeChat",
        providerEntryLabel: providerCount > 0 ? `Linked providers (${providerCount})` : "Linked providers",
        cancellationEntryLabel: availability === "cancellation_pending" ? "Cancellation requested" : "Cancellation entry",
      },
    },
    featureToggles: settingsState.featureToggles,
    privacyOptions: settingsState.privacyOptions,
    effectivePolicy: settingsState.effectivePolicy,
    notificationChannels: settingsState.notificationChannels,
    lockedSettingKeys: settingsState.lockedSettingKeys,
  };
}

function isPurchasedByMembership(
  record: { requiresMembership: boolean; isPurchased?: boolean },
  membershipActive: boolean,
): boolean {
  return Boolean(record.isPurchased || (record.requiresMembership && membershipActive));
}

function resolveNovelAccess(detail: NovelDetail, membershipActive: boolean): NovelDetail {
  return {
    ...detail,
    isPurchased: isPurchasedByMembership(detail, membershipActive),
  };
}

function createBookshelfCountResolver(bookshelfNovelIds: Set<string>) {
  const initialBookshelfNovelIds = new Set<string>(DEFAULT_BOOKSHELF_NOVEL_IDS);

  return (detail: NovelDetail): number | undefined => {
    if (detail.bookshelfCount === undefined) {
      return detail.bookshelfCount;
    }

    if (bookshelfNovelIds.has(detail.id) && !initialBookshelfNovelIds.has(detail.id)) {
      return detail.bookshelfCount + 1;
    }

    if (!bookshelfNovelIds.has(detail.id) && initialBookshelfNovelIds.has(detail.id)) {
      return Math.max(0, detail.bookshelfCount - 1);
    }

    return detail.bookshelfCount;
  };
}

function createNovelContentLifecycle(detail: NovelDetail): ContentLifecycle {
  const updatedAt = detail.latestChapter?.updatedAt ?? "2026-03-22T08:00:00.000Z";
  return {
    state: "published",
    availableActions: ["update", "archive", "delete"],
    publishedAt: updatedAt,
    updatedAt,
  };
}

function createNovelContentDisplay(
  detail: NovelDetail,
  slot: ContentDisplay["recommendationSlot"],
  slotLabel: string,
): ContentDisplay {
  return {
    category: {
      key: detail.categoryKey,
      label: detail.categoryLabel,
    },
    tags: detail.tags.map((tag) => ({ key: tag.key, label: tag.label })),
    topics: detail.tags.slice(0, 2).map((tag) => ({ key: tag.key, label: tag.label })),
    ...(slot ? { recommendationSlot: slot } : {}),
    recommendationSlotLabel: slotLabel,
    pinned: detail.status === "serializing",
    featured: detail.requiresMembership || detail.status === "serializing",
  };
}

function createNovelContentAccess(detail: NovelDetail): ContentAccess {
  const purchased = Boolean(detail.isPurchased);
  return {
    visibility: detail.requiresMembership ? "member_only" : "public",
    accessible: !detail.requiresMembership || purchased || detail.isFree,
    previewAvailable: Boolean(detail.isFree || detail.isTrial),
    requiresLogin: false,
    requiresMembership: detail.requiresMembership,
    requiresPurchase: false,
    purchased,
    summaryLabel:
      detail.accessRuleSummaryLabel ??
      (detail.requiresMembership
        ? "This title stays in the premium lane until membership unlocks the complete reading route after the visible preview boundary."
        : "Open-access reading continues without a paywall in the current sample surface."),
    ...(detail.requiresMembership ? { gateLabel: "Membership required for full reading" } : {}),
    ...(detail.requiresMembership ? { entitlementLabel: "Membership unlock" } : {}),
  };
}

function createNovelContentDetail(detail: NovelDetail): ContentDetail {
  return {
    contentId: detail.id,
    model: "novel_story",
    title: detail.title,
    ...(detail.subtitle ? { subtitle: detail.subtitle } : {}),
    summary: detail.summary,
    ...(detail.coverUrl ? { coverUrl: detail.coverUrl } : {}),
    authorLabel: detail.author.name,
    display: createNovelContentDisplay(
      detail,
      detail.requiresMembership ? "premium" : detail.status === "serializing" ? "frontlist" : "ranking",
      detail.requiresMembership
        ? "Premium Spotlight"
        : detail.status === "serializing"
          ? "Frontlist Serial"
          : "Completed Archive",
    ),
    lifecycle: createNovelContentLifecycle(detail),
    ...(detail.relatedLaneLabel ? { recommendationReason: detail.relatedLaneLabel } : {}),
  };
}

function createNovelContentCard(
  detail: NovelDetail,
  continueChapterId: string | undefined,
  continueChapterTitle: string | undefined,
): ContentCard {
  const slot = continueChapterId
    ? "continue_reading"
    : detail.requiresMembership
      ? "premium"
      : detail.status === "serializing"
        ? "frontlist"
        : "ranking";
  const slotLabel = continueChapterId
    ? continueChapterTitle
      ? `Continue · ${continueChapterTitle}`
      : "Continue Reading"
    : detail.requiresMembership
      ? "Premium Spotlight"
      : detail.status === "serializing"
        ? "Frontlist Serial"
        : "Completed Archive";

  return {
    contentId: detail.id,
    model: "novel_story",
    title: detail.title,
    ...(detail.subtitle ? { subtitle: detail.subtitle } : {}),
    summary: detail.summary,
    ...(detail.coverUrl ? { coverUrl: detail.coverUrl } : {}),
    authorLabel: detail.author.name,
    display: createNovelContentDisplay(detail, slot, slotLabel),
    lifecycle: createNovelContentLifecycle(detail),
  };
}

function createRelatedNovelSummaries(detail: NovelDetail, membershipActive: boolean): RelatedNovelSummary[] {
  return NOVELS.filter((candidate) => candidate.id !== detail.id)
    .sort((left, right) => {
      const leftScore = Number(left.categoryKey === detail.categoryKey) * 2 + Number(left.status === detail.status);
      const rightScore = Number(right.categoryKey === detail.categoryKey) * 2 + Number(right.status === detail.status);
      return rightScore - leftScore;
    })
    .slice(0, 3)
    .map((candidate) => {
      const resolvedCandidate = resolveNovelAccess(candidate, membershipActive);
      return {
        id: resolvedCandidate.id,
        title: resolvedCandidate.title,
        authorName: resolvedCandidate.author.name,
        categoryLabel: resolvedCandidate.categoryLabel,
        status: resolvedCandidate.status,
        requiresMembership: resolvedCandidate.requiresMembership && !resolvedCandidate.isPurchased,
        highlight:
          resolvedCandidate.categoryKey === detail.categoryKey
            ? `Shared ${resolvedCandidate.categoryLabel.toLowerCase()} lane`
            : resolvedCandidate.status === detail.status
              ? `Similar ${resolvedCandidate.status} rhythm`
              : "Editorially adjacent pick",
      };
    });
}

export function resolveNovelDetail(
  detail: NovelDetail,
  membershipActive: boolean,
  bookshelfNovelIds?: Set<string>,
  requestUrl?: string,
): NovelDetail {
  const resolveBookshelfCount = bookshelfNovelIds ? createBookshelfCountResolver(bookshelfNovelIds) : undefined;
  const bookshelfCount = resolveBookshelfCount?.(detail);
  const resolvedCoverUrl =
    detail.coverUrl && requestUrl ? resolveSampleMediaUrl(detail.coverUrl, requestUrl) : detail.coverUrl;

  const resolvedDetail = {
    ...detail,
    ...(resolvedCoverUrl ? { coverUrl: resolvedCoverUrl } : {}),
    isPurchased: isPurchasedByMembership(detail, membershipActive),
    ...(bookshelfCount !== undefined ? { bookshelfCount } : {}),
    ...(bookshelfNovelIds ? { inBookshelf: bookshelfNovelIds.has(detail.id) } : {}),
    relatedNovels: createRelatedNovelSummaries(detail, membershipActive),
  };

  return {
    ...resolvedDetail,
    contentDetail: createNovelContentDetail(resolvedDetail),
    contentAccess: createNovelContentAccess(resolvedDetail),
  };
}

export function resolveChapterSummary(chapter: ChapterSummary, membershipActive: boolean): ChapterSummary {
  return {
    ...chapter,
    isPurchased: isPurchasedByMembership(chapter, membershipActive),
  };
}

export function resolveChapterList(
  response: ChapterListResponse,
  membershipActive: boolean,
): ChapterListResponse {
  return {
    ...response,
    volumes: response.volumes.map((volume) => ({
      ...volume,
      chapters: volume.chapters.map((chapter) => resolveChapterSummary(chapter, membershipActive)),
    })),
  };
}

export function resolveChapterContent(
  chapter: ChapterContent,
  membershipActive: boolean,
): ChapterContent {
  return {
    ...chapter,
    isPurchased: isPurchasedByMembership(chapter, membershipActive),
  };
}

export function toNovelCard(
  detail: NovelDetail,
  membershipActive: boolean,
  userState: UserState,
  requestUrl?: string,
): NovelCard {
  const resolvedDetail = resolveNovelDetail(detail, membershipActive, userState.bookshelfNovelIds, requestUrl);
  const progress = userState.progressByNovelId[resolvedDetail.id];
  const continueChapterId = progress?.chapterId ?? resolvedDetail.continueChapterId ?? resolvedDetail.firstChapterId;
  const continueChapterTitle = continueChapterId ? CHAPTER_CONTENT[continueChapterId]?.title : undefined;

  return {
    id: resolvedDetail.id,
    slug: resolvedDetail.slug,
    title: resolvedDetail.title,
    authorName: resolvedDetail.author.name,
    summary: resolvedDetail.summary,
    categoryKey: resolvedDetail.categoryKey,
    categoryLabel: resolvedDetail.categoryLabel,
    tags: resolvedDetail.tags,
    status: resolvedDetail.status,
    updatedAt: resolvedDetail.latestChapter?.updatedAt ?? "2026-03-22T08:00:00.000Z",
    wordCount: resolvedDetail.wordCount,
    isFree: resolvedDetail.isFree,
    isTrial: resolvedDetail.isTrial,
    requiresMembership: resolvedDetail.requiresMembership,
    ...(resolvedDetail.latestChapter?.id ? { latestChapterId: resolvedDetail.latestChapter.id } : {}),
    ...(resolvedDetail.latestChapter?.title ? { latestChapterTitle: resolvedDetail.latestChapter.title } : {}),
    ...(resolvedDetail.latestChapter?.order !== undefined
      ? { latestChapterOrder: resolvedDetail.latestChapter.order }
      : {}),
    ...(continueChapterId ? { continueChapterId } : {}),
    ...(continueChapterTitle ? { continueChapterTitle } : {}),
    ...(resolvedDetail.readingCount !== undefined ? { readingCount: resolvedDetail.readingCount } : {}),
    ...(resolvedDetail.bookshelfCount !== undefined ? { bookshelfCount: resolvedDetail.bookshelfCount } : {}),
    ...(resolvedDetail.coverUrl ? { coverUrl: resolvedDetail.coverUrl } : {}),
    ...(resolvedDetail.isPurchased !== undefined ? { isPurchased: resolvedDetail.isPurchased } : {}),
    contentCard: createNovelContentCard(resolvedDetail, continueChapterId, continueChapterTitle),
    contentAccess: createNovelContentAccess(resolvedDetail),
  };
}

export function listItems(page = 1, pageSize = 2): ItemsListResponse {
  const start = (page - 1) * pageSize;
  return {
    items: HOST_ITEMS.slice(start, start + pageSize),
    page,
    pageSize,
    hasMore: start + pageSize < HOST_ITEMS.length,
  };
}

function resolveFeedTag(itemId: string): FeedTag {
  if (itemId === "lesson_1") {
    return { key: "warmup", label: "Warm-up" };
  }

  if (itemId === "lesson_2") {
    return { key: "input", label: "Input" };
  }

  if (itemId === "lesson_3") {
    return { key: "practice", label: "Practice" };
  }

  if (itemId === "lesson_4") {
    return { key: "speaking", label: "Speaking" };
  }

  return { key: "review", label: "Review" };
}

function createFeedItems(userState?: UserState): FeedItem[] {
  const personalizedRecommendations = isPersonalizedRecommendationsEnabled(userState);
  return HOST_ITEMS.map((item, index) => {
    const tag = resolveFeedTag(item.id);
    const managedContent = createManagedContentCard(item.id, userState);
    const managedAccess = createManagedContentAccess(item.id, userState);
    return {
      id: item.id,
      title: item.title,
      ...(item.subtitle ? { subtitle: item.subtitle } : {}),
      ...(item.categoryLabel ? { eyebrow: item.categoryLabel } : {}),
      ...(item.recommendedReason
        ? { recommendedReason: personalizedRecommendations ? item.recommendedReason : "Recommended for all signed-in readers." }
        : {}),
      updatedAt: `2026-04-0${Math.min(index + 1, 8)}T08:00:00.000Z`,
      tag: tag.key,
      ...(managedContent ? { contentCard: managedContent } : {}),
      ...(managedAccess ? { contentAccess: managedAccess } : {}),
    };
  });
}

function createSuggestionTerms(keyword: string | undefined, fallbackTerms: string[]): string[] {
  const normalized = keyword?.trim().toLowerCase();
  if (!normalized) {
    return fallbackTerms.slice(0, 3);
  }

  const matched = fallbackTerms.filter((term) => term.toLowerCase().includes(normalized));
  if (matched.length > 0) {
    return matched.slice(0, 3);
  }

  return fallbackTerms.slice(0, 3);
}

const TYPO_CORRECTIONS: Record<string, string> = {
  travle: "travel",
  travl: "travel",
  speeking: "speaking",
  litening: "listening",
  listenning: "listening",
  usre: "user",
  noval: "novel",
};

function createCorrectionKeyword(keyword: string | undefined, fallbackTerms: string[]): string | undefined {
  const normalized = keyword?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (TYPO_CORRECTIONS[normalized]) {
    return TYPO_CORRECTIONS[normalized];
  }

  return fallbackTerms.find((term) => term.toLowerCase().startsWith(normalized.slice(0, 3)));
}

function createRecoverySuggestions(keyword: string | undefined, hotKeywords: string[], correctionKeyword?: string) {
  const normalized = keyword?.trim().toLowerCase();
  const candidates = correctionKeyword
    ? [correctionKeyword, ...hotKeywords.filter((term) => term.toLowerCase() !== correctionKeyword.toLowerCase())]
    : hotKeywords;

  return candidates
    .filter((term) => term.toLowerCase() !== normalized)
    .slice(0, 3)
    .map((term, index) => ({
      keyword: term,
      label: index === 0 && correctionKeyword ? `Try ${term}` : `Search ${term}`,
      reason:
        index === 0 && correctionKeyword
          ? "Correction term derived from the current search keyword."
          : "Hot or reusable query from the shared search center.",
    }));
}

function createSearchRankingSummary(activeSortKey: string) {
  return {
    strategy: activeSortKey,
    appliedSortKey: activeSortKey,
    label:
      activeSortKey === "updatedAt"
        ? "Results ranked by freshness."
        : activeSortKey === "popular"
          ? "Results ranked by popularity."
          : "Results ranked by recommendation relevance.",
  };
}

function createFeedItemRouteTarget(item: FeedItem): FeedItem["routeTarget"] {
  if (item.tag === "user") {
    return {
      routeId: APP_ROUTE_IDS.account,
      params: {
        targetUserId: item.id,
      },
      label: "Open account profile",
    };
  }

  return {
    routeId: APP_ROUTE_IDS.overview,
    params: {
      id: item.id,
    },
    label: "Open detail",
  };
}

function createFeedItemRanking(item: FeedItem, index: number, activeSortKey: string, keyword: string | undefined) {
  const normalizedKeyword = keyword?.trim().toLowerCase();
  const matchedFields = [
    normalizedKeyword && item.title.toLowerCase().includes(normalizedKeyword) ? "title" : undefined,
    normalizedKeyword && item.subtitle?.toLowerCase().includes(normalizedKeyword) ? "subtitle" : undefined,
    normalizedKeyword && item.recommendedReason?.toLowerCase().includes(normalizedKeyword) ? "reason" : undefined,
  ].filter((value): value is string => Boolean(value));

  return {
    score: Math.max(1, 100 - index * 7),
    label: index === 0 ? "Top match" : `Rank ${index + 1}`,
    strategy: activeSortKey,
    matchedFields: matchedFields.length > 0 ? matchedFields : ["recommendation"],
  };
}

function decorateSearchItems(items: FeedItem[], activeSortKey: string, keyword: string | undefined): FeedItem[] {
  return items.map((item, index): FeedItem => {
    const routeTarget: NonNullable<FeedItem["routeTarget"]> = item.routeTarget ?? createFeedItemRouteTarget(item)!;
    return {
      ...item,
      ranking: createFeedItemRanking(item, index, activeSortKey, keyword),
      routeTarget,
    };
  });
}

function resolveFeedSortKey(sortKey: string | undefined): string {
  return sortKey === "updatedAt" || sortKey === "popular" ? sortKey : "recommended";
}

function sortFeedItems(items: FeedItem[], activeSortKey: string): FeedItem[] {
  if (activeSortKey === "updatedAt") {
    return [...items].sort((left, right) => (right.updatedAt ?? "").localeCompare(left.updatedAt ?? ""));
  }

  if (activeSortKey === "popular") {
    return [...items].sort((left, right) => (right.recommendedReason?.length ?? 0) - (left.recommendedReason?.length ?? 0));
  }

  return items;
}

function createFeedSearchFilters(items: FeedItem[], activeTag?: string): SearchFilterGroup[] {
  const tagCounts = new Map<string, number>();
  const allTags = items.map((item) => resolveFeedTag(item.id));

  for (const tag of allTags) {
    tagCounts.set(tag.key, (tagCounts.get(tag.key) ?? 0) + 1);
  }

  return [
    {
      key: "tag",
      label: "Content type",
      selectedKeys: activeTag && activeTag !== "all" ? [activeTag] : [],
      options: [
        { key: "all", label: "All", count: items.length },
        ...Array.from(new Map(allTags.map((tag) => [tag.key, tag])).values()).map((tag) => ({
          key: tag.key,
          label: tag.label,
          count: tagCounts.get(tag.key) ?? 0,
        })),
      ],
    },
  ];
}

function createNovelSearchFilters(
  allCards: NovelCard[],
  input: {
    categoryKey?: string | undefined;
    status?: string | undefined;
  },
): SearchFilterGroup[] {
  const categoryCounts = new Map<string, { label: string; count: number }>();
  const statusCounts = new Map<string, number>();

  for (const card of allCards) {
    const existingCategory = categoryCounts.get(card.categoryKey);
    categoryCounts.set(card.categoryKey, {
      label: card.categoryLabel,
      count: (existingCategory?.count ?? 0) + 1,
    });
    statusCounts.set(card.status, (statusCounts.get(card.status) ?? 0) + 1);
  }

  return [
    {
      key: "category",
      label: "Category",
      selectedKeys: input.categoryKey && input.categoryKey !== "all" ? [input.categoryKey] : [],
      options: [
        { key: "all", label: "All", count: allCards.length },
        ...Array.from(categoryCounts.entries()).map(([key, value]) => ({
          key,
          label: value.label,
          count: value.count,
        })),
      ],
    },
    {
      key: "status",
      label: "Status",
      selectedKeys: input.status && input.status !== "all" ? [input.status] : [],
      options: [
        { key: "all", label: "Any status", count: allCards.length },
        { key: "serializing", label: "Serializing", count: statusCounts.get("serializing") ?? 0 },
        { key: "completed", label: "Completed", count: statusCounts.get("completed") ?? 0 },
        { key: "paused", label: "Paused", count: statusCounts.get("paused") ?? 0 },
      ],
    },
  ];
}

function createNovelSortOptions(): SearchSortOption[] {
  return [
    { key: "recommended", label: "Recommended" },
    { key: "updatedAt", label: "Latest" },
    { key: "popular", label: "Popular" },
    { key: "wordCount", label: "Length" },
  ];
}

function createFeedSortOptions(): SearchSortOption[] {
  return [
    { key: "recommended", label: "Recommended" },
    { key: "updatedAt", label: "Latest" },
    { key: "popular", label: "Popular" },
  ];
}

function resolveProfileVisibility(userState?: UserState): SettingsProfileVisibility {
  return userState?.settingsState?.privacyOptions?.profileVisibility ?? "signed_in_only";
}

function canExposeRelationSearch(userState: UserState | undefined, relation: UserState["relationTarget"] | undefined): boolean {
  const visibility = resolveProfileVisibility(userState);
  if (!relation) {
    return false;
  }
  if (visibility === "public" || visibility === "signed_in_only") {
    return true;
  }
  return Boolean(relation.followedBy || relation.friend || relation.friendState === "mutual");
}

function canExposeRemarkName(userState: UserState | undefined, relation: UserState["relationTarget"] | undefined): boolean {
  const visibility = resolveProfileVisibility(userState);
  if (!relation?.remarkName) {
    return false;
  }
  if (visibility === "public") {
    return true;
  }
  if (visibility === "followers_only") {
    return Boolean(relation.followedBy || relation.friend || relation.friendState === "mutual");
  }
  return false;
}

function isPersonalizedRecommendationsEnabled(userState?: UserState): boolean {
  return userState?.settingsState?.privacyOptions?.personalizedRecommendations ?? true;
}

function createFeedSearchResults(
  items: FeedItem[],
  total: number,
  hasMore: boolean,
  emptyText: string,
  hotKeywords: string[],
  activeSortKey: string,
  keyword: string,
  options: {
    correctionKeyword?: string;
    correctionReason?: string;
  } = {},
): SearchResults<FeedItem> {
  const featuredReason = items[0]?.recommendedReason;

  return {
    items,
    total,
    hasMore,
    emptyText,
    ...(featuredReason ? { featuredReason } : {}),
    suggestionTerms: createSuggestionTerms(keyword, hotKeywords),
    hotKeywords,
    recentKeywords: [],
    sortOptions: createFeedSortOptions(),
    activeSortKey,
    ...(options.correctionKeyword ? { correctionKeyword: options.correctionKeyword } : {}),
    ...(options.correctionReason ? { correctionReason: options.correctionReason } : {}),
    recoverySuggestions: createRecoverySuggestions(keyword, hotKeywords, options.correctionKeyword),
    ranking: createSearchRankingSummary(activeSortKey),
  };
}

function filterSearchItems<TItem>(
  items: TItem[],
  keyword: string,
  project: (item: TItem) => Array<string | undefined>,
): TItem[] {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return items;
  }

  return items.filter((item) =>
    project(item).some((value) => value?.toLowerCase().includes(normalizedKeyword)),
  );
}

function createUserSearchItems(userState?: UserState): FeedItem[] {
  const relation = userState?.relationTarget;
  const visibility = resolveProfileVisibility(userState);
  const items: FeedItem[] = [
    {
      id: "user_current",
      title: userState?.profileOverrides?.nickname ?? "MiniX User",
      subtitle:
        visibility === "public"
          ? "Public profile"
          : visibility === "followers_only"
            ? "Followers-only profile"
            : "Current signed-in account",
      eyebrow: "User",
      recommendedReason:
        visibility === "public"
          ? "This profile is visible across shared discovery surfaces."
          : visibility === "followers_only"
            ? "This profile is limited to follower-aware discovery surfaces."
            : "Use the shared search center to jump between account, creator, and domain surfaces.",
      tag: "user",
    },
  ];

  if (relation && canExposeRelationSearch(userState, relation)) {
    items.push({
      id: relation.targetUserId,
      title: relation.displayName,
      subtitle: relation.friend ? "Mutual connection" : relation.following ? "Following" : "Suggested user",
      eyebrow: "User",
      recommendedReason: canExposeRemarkName(userState, relation)
        ? `Remark: ${relation.remarkName}`
        : relation.blocked
          ? "Blocked relation target"
          : "Shared relation surface sample result",
      tag: "user",
    });
  }

  return items;
}

function createNovelFeedItems(userState?: UserState): FeedItem[] {
  return NOVELS.slice(0, 4).map((detail) => ({
    id: detail.id,
    title: detail.title,
    ...(detail.subtitle ? { subtitle: detail.subtitle } : {}),
    eyebrow: "Novel",
    recommendedReason: detail.relatedLaneLabel ?? detail.summary,
    ...(detail.latestChapter?.updatedAt ? { updatedAt: detail.latestChapter.updatedAt } : {}),
    tag: "novel",
    contentCard: createNovelContentCard(detail, detail.continueChapterId, detail.latestChapter?.title),
    contentAccess: createNovelContentAccess(detail),
  }));
}

function createContentSearchItems(userState?: UserState): FeedItem[] {
  return HOST_ITEMS.map((item, index) => {
    const contentCard = createManagedContentCard(item.id, userState);
    const contentAccess = createManagedContentAccess(item.id, userState);
    return {
      id: item.id,
      title: item.title,
      ...(item.subtitle ? { subtitle: item.subtitle } : {}),
      eyebrow: "Content",
      ...(contentCard?.lifecycle.reviewMessage ?? item.recommendedReason
        ? { recommendedReason: contentCard?.lifecycle.reviewMessage ?? item.recommendedReason }
        : {}),
      updatedAt: `2026-04-1${Math.min(index, 8)}T08:00:00.000Z`,
      tag: "content",
      ...(contentCard ? { contentCard } : {}),
      ...(contentAccess ? { contentAccess } : {}),
    };
  });
}

function createSearchDomainTabs(input: Array<{ domain: SearchDomain; label: string; total: number }>, activeDomain: SearchDomain) {
  return input.map((item) => ({
    ...item,
    active: item.domain === activeDomain,
  }));
}

function createSearchResultGroups(
  input: Array<{ domain: SearchDomain; label: string; items: FeedItem[] }>,
) {
  return input.map((group) => ({
    domain: group.domain,
    label: group.label,
    total: group.items.length,
    items: group.items,
    ...(group.items[0]?.recommendedReason ? { featuredReason: group.items[0].recommendedReason } : {}),
  }));
}

function createUnifiedFeedResults(
  input: {
    keyword: string;
    page: number;
    pageSize: number;
    mode: FeedListResponse["searchQuery"]["mode"];
    domain: SearchDomain;
    sort?: string | undefined;
    tag?: string | undefined;
  },
  userState?: UserState,
): FeedListResponse {
  const hotKeywords = ["travel", "speaking", "listening", "review", "user", "novel"];
  const activeSortKey = resolveFeedSortKey(input.sort);
  const feedItems = decorateSearchItems(sortFeedItems(filterSearchItems(createFeedItems(userState), input.keyword, (item) => [
    item.title,
    item.subtitle,
    item.eyebrow,
    item.recommendedReason,
  ]), activeSortKey), activeSortKey, input.keyword);
  const contentItems = decorateSearchItems(sortFeedItems(filterSearchItems(createContentSearchItems(userState), input.keyword, (item) => [
    item.title,
    item.subtitle,
    item.eyebrow,
    item.recommendedReason,
    item.contentCard?.lifecycle.state,
  ]), activeSortKey), activeSortKey, input.keyword);
  const novelItems = decorateSearchItems(sortFeedItems(filterSearchItems(createNovelFeedItems(userState), input.keyword, (item) => [
    item.title,
    item.subtitle,
    item.recommendedReason,
  ]), activeSortKey), activeSortKey, input.keyword);
  const userItems = decorateSearchItems(sortFeedItems(filterSearchItems(createUserSearchItems(userState), input.keyword, (item) => [
    item.title,
    item.subtitle,
    item.recommendedReason,
  ]), activeSortKey), activeSortKey, input.keyword);

  const searchMode = input.mode;
  const requestedDomain = input.domain;
  const scopedGroups =
    searchMode === "user" || requestedDomain === "user"
      ? [{ domain: "user" as const, label: "Users", items: userItems }]
      : searchMode === "content"
        ? [
            { domain: "content" as const, label: "Content", items: contentItems },
            { domain: "novel" as const, label: "Novels", items: novelItems },
          ]
        : requestedDomain === "all"
          ? [
              { domain: "feed" as const, label: "Feed", items: feedItems },
              { domain: "content" as const, label: "Content", items: contentItems },
              { domain: "novel" as const, label: "Novels", items: novelItems },
              { domain: "user" as const, label: "Users", items: userItems },
            ]
          : requestedDomain === "content"
            ? [{ domain: "content" as const, label: "Content", items: contentItems }]
            : requestedDomain === "novel"
              ? [{ domain: "novel" as const, label: "Novels", items: novelItems }]
              : [{ domain: "feed" as const, label: "Feed", items: feedItems }];

  const flattened = scopedGroups.flatMap((group) => group.items);
  const start = (input.page - 1) * input.pageSize;
  const pagedItems = flattened.slice(start, start + input.pageSize);
  const hasMore = start + input.pageSize < flattened.length;
  const activeDomain =
    requestedDomain === "all"
      ? searchMode === "user"
        ? "user"
        : searchMode === "content"
          ? "content"
          : "all"
      : requestedDomain;

  const tags = [
    { key: "all", label: "All" },
    { key: "feed", label: "Feed" },
    { key: "content", label: "Content" },
    { key: "novel", label: "Novel" },
    { key: "user", label: "User" },
  ];

  const resultGroups = createSearchResultGroups(scopedGroups);
  const correctionKeyword = flattened.length === 0 ? createCorrectionKeyword(input.keyword, hotKeywords) : undefined;
  return {
    items: pagedItems,
    page: input.page,
    pageSize: input.pageSize,
    hasMore,
    tags,
    ...(pagedItems[0]?.recommendedReason ? { featuredReason: pagedItems[0].recommendedReason } : {}),
    searchQuery: {
      keyword: input.keyword,
      mode: searchMode,
      domain: requestedDomain,
      page: input.page,
      pageSize: input.pageSize,
      ...(activeSortKey !== "recommended" ? { sortKey: activeSortKey } : {}),
    },
    searchFilters: [
      {
        key: "domain",
        label: "Search domain",
        selectedKeys: activeDomain === "all" ? [] : [activeDomain],
        options: [
          { key: "all", label: "All", count: flattened.length },
          { key: "feed", label: "Feed", count: feedItems.length },
          { key: "content", label: "Content", count: contentItems.length },
          { key: "novel", label: "Novel", count: novelItems.length },
          { key: "user", label: "User", count: userItems.length },
        ],
      },
    ],
    searchResults: {
      items: pagedItems,
      total: flattened.length,
      hasMore,
      emptyText:
        searchMode === "user" || requestedDomain === "user"
          ? "No user results matched this search."
          : searchMode === "content" || requestedDomain === "content"
            ? "No content results matched this search."
            : "No cross-domain results matched this search.",
      ...(pagedItems[0]?.recommendedReason ? { featuredReason: pagedItems[0].recommendedReason } : {}),
      suggestionTerms: createSuggestionTerms(input.keyword, hotKeywords),
      hotKeywords,
      recentKeywords: [],
      sortOptions: createFeedSortOptions(),
      activeSortKey,
      ...(correctionKeyword ? { correctionKeyword } : {}),
      ...(correctionKeyword ? { correctionReason: `No exact matches for "${input.keyword}".` } : {}),
      recoverySuggestions: createRecoverySuggestions(input.keyword, hotKeywords, correctionKeyword),
      ranking: createSearchRankingSummary(activeSortKey),
      domainTabs: createSearchDomainTabs(
        [
          { domain: "all", label: "All", total: feedItems.length + contentItems.length + novelItems.length + userItems.length },
          { domain: "feed", label: "Feed", total: feedItems.length },
          { domain: "content", label: "Content", total: contentItems.length },
          { domain: "novel", label: "Novel", total: novelItems.length },
          { domain: "user", label: "User", total: userItems.length },
        ],
        activeDomain,
      ),
      activeDomain,
      resultGroups,
    },
  };
}

function createNovelSearchResults(
  items: NovelCard[],
  total: number,
  hasMore: boolean,
  emptyText: string,
  hotKeywords: string[],
  activeSortKey: string,
  keyword: string,
): SearchResults<NovelCard> {
  const featuredReason = items[0]?.recommendedReason;

  return {
    items,
    total,
    hasMore,
    emptyText,
    ...(featuredReason ? { featuredReason } : {}),
    suggestionTerms: createSuggestionTerms(keyword, hotKeywords),
    hotKeywords,
    recentKeywords: [],
    sortOptions: createNovelSortOptions(),
    activeSortKey,
  };
}

type ManagedContentEntry = NonNullable<UserState["managedContentById"]>[string];

interface ManagedContentMutationSuccess<TValue> {
  ok: true;
  value: TValue;
}

interface ManagedContentMutationFailure {
  ok: false;
  code: "NOT_FOUND" | "FORBIDDEN";
  message: string;
}

type ManagedContentMutationResult<TValue> = ManagedContentMutationSuccess<TValue> | ManagedContentMutationFailure;

function resolveManagedContentEntry(contentId: string, userState?: UserState): ManagedContentEntry | undefined {
  return userState?.managedContentById?.[contentId] ?? createDefaultManagedContentEntries()[contentId];
}

function cloneManagedContentAttachments(attachments: ContentAttachmentReference[]): ContentAttachmentReference[] {
  return attachments.map((attachment) => ({
    assetId: attachment.assetId,
    kind: attachment.kind,
    label: attachment.label,
    ...(attachment.url ? { url: attachment.url } : {}),
    ...(attachment.thumbnailUrl ? { thumbnailUrl: attachment.thumbnailUrl } : {}),
  }));
}

function cloneManagedContentReviewRecord(reviewRecord: ContentReviewRecord): ContentReviewRecord {
  return {
    reviewId: reviewRecord.reviewId,
    status: reviewRecord.status,
    ...(reviewRecord.queueLabel ? { queueLabel: reviewRecord.queueLabel } : {}),
    ...(reviewRecord.reviewerLabel ? { reviewerLabel: reviewRecord.reviewerLabel } : {}),
    ...(reviewRecord.submittedAt ? { submittedAt: reviewRecord.submittedAt } : {}),
    ...(reviewRecord.assignedAt ? { assignedAt: reviewRecord.assignedAt } : {}),
    ...(reviewRecord.decidedAt ? { decidedAt: reviewRecord.decidedAt } : {}),
    ...(reviewRecord.message ? { message: reviewRecord.message } : {}),
  };
}

function cloneManagedContentAuditHistory(auditHistory: ContentAuditEntry[]): ContentAuditEntry[] {
  return auditHistory.map((entry) => ({
    auditId: entry.auditId,
    action: entry.action,
    actorRole: entry.actorRole,
    actorLabel: entry.actorLabel,
    createdAt: entry.createdAt,
    message: entry.message,
  }));
}

function cloneManagedContentAuthoring(authoring: ContentAuthoringData): ContentAuthoringData {
  return {
    title: authoring.title,
    ...(authoring.subtitle ? { subtitle: authoring.subtitle } : {}),
    summary: authoring.summary,
    ...(authoring.bodyPreview ? { bodyPreview: authoring.bodyPreview } : {}),
    visibility: authoring.visibility,
    category: { ...authoring.category },
    tags: authoring.tags.map((tag) => ({ ...tag })),
    ...(authoring.coverAssetId ? { coverAssetId: authoring.coverAssetId } : {}),
    attachmentAssetIds: [...authoring.attachmentAssetIds],
  };
}

function resolveManagedContentActorRole(actorRole: ContentActorRole | undefined): ContentActorRole {
  return actorRole ?? "reader";
}

function createManagedContentPermissions(
  entry: ManagedContentEntry,
  actorRole: ContentActorRole | undefined,
): ContentPermissions {
  const resolvedActorRole = resolveManagedContentActorRole(actorRole);
  const isAuthor = resolvedActorRole === "author";
  const isReviewer = resolvedActorRole === "reviewer";
  const isAdmin = resolvedActorRole === "admin";

  return {
    actorRole: resolvedActorRole,
    canEdit: isAuthor || isAdmin,
    canSaveDraft: isAuthor || isAdmin,
    canSubmitReview: isAuthor || isAdmin,
    canApproveReview: isReviewer || isAdmin,
    canRejectReview: isReviewer || isAdmin,
    canArchive: isReviewer || isAdmin,
    canDelete: isAuthor || isAdmin,
    canRestore: isReviewer || isAdmin,
    canChangeVisibility: isAuthor || isAdmin,
    canManageAttachments: isAuthor || isAdmin,
    canViewAuditHistory: resolvedActorRole !== "reader",
  };
}

function createManagedContentLifecycleActions(state: ContentLifecycle["state"]): ContentLifecycleAction[] {
  switch (state) {
    case "published":
      return ["update", "archive", "delete", "change_visibility"];
    case "offline":
      return ["restore", "delete", "change_visibility"];
    case "under_review":
      return ["approve_review", "reject_review", "change_visibility"];
    case "review_rejected":
      return ["update", "submit_review", "delete", "change_visibility"];
    case "deleted":
      return ["restore"];
    case "draft":
    default:
      return ["publish", "update", "submit_review", "delete", "change_visibility"];
  }
}

function createManagedContentDisplay(contentId: string, userState?: UserState): ContentDisplay | undefined {
  const entry = resolveManagedContentEntry(contentId, userState);
  if (!entry) {
    return undefined;
  }

  return {
    category: {
      key: entry.categoryKey,
      label: entry.categoryLabel,
    },
    tags: entry.tags.map((tag) => ({ ...tag })),
    topics: entry.tags.map((tag) => ({ ...tag })),
    recommendationSlot: entry.lifecycle.state === "published" ? "editorial" : "related",
    recommendationSlotLabel: entry.lifecycle.state === "published" ? "Managed Frontlist" : "Lifecycle Queue",
    pinned: entry.lifecycle.state === "published",
    featured: entry.lifecycle.state === "under_review" || entry.lifecycle.state === "review_rejected",
  };
}

function resolveManagedContentCoverUrl(entry: ManagedContentEntry, userState?: UserState): string | undefined {
  return entry.coverAssetId && userState ? resolveUploadAssetForUser(userState, entry.coverAssetId)?.url : undefined;
}

function resolveManagedContentAttachments(
  entry: ManagedContentEntry,
  userState?: UserState,
): ContentAttachmentReference[] {
  return entry.attachments.map((attachment) => {
    const asset = userState ? resolveUploadAssetForUser(userState, attachment.assetId) : undefined;
    return {
      assetId: attachment.assetId,
      kind: attachment.kind,
      label: attachment.label,
      ...(asset?.url ? { url: asset.url } : {}),
      ...(asset?.thumbnailUrl ? { thumbnailUrl: asset.thumbnailUrl } : {}),
    };
  });
}

function createManagedContentCard(
  contentId: string,
  userState?: UserState,
  actorRole?: ContentActorRole,
): ContentCard | undefined {
  const entry = resolveManagedContentEntry(contentId, userState);
  const display = createManagedContentDisplay(contentId, userState);
  if (!entry || !display) {
    return undefined;
  }
  const coverUrl = resolveManagedContentCoverUrl(entry, userState);

  return {
    contentId,
    model: entry.model,
    title: entry.title,
    ...(entry.subtitle ? { subtitle: entry.subtitle } : {}),
    summary: entry.summary,
    ...(coverUrl ? { coverUrl } : {}),
    authorLabel: entry.authorLabel,
    display,
    lifecycle: {
      ...entry.lifecycle,
      availableActions: [...entry.lifecycle.availableActions],
    },
    ...(actorRole && entry.reviewRecord ? { reviewRecord: cloneManagedContentReviewRecord(entry.reviewRecord) } : {}),
  };
}

function createManagedContentAccess(
  contentId: string,
  userState?: UserState,
  actorRole?: ContentActorRole,
): ContentAccess | undefined {
  const entry = resolveManagedContentEntry(contentId, userState);
  if (!entry) {
    return undefined;
  }

  const resolvedActorRole = resolveManagedContentActorRole(actorRole);
  const privileged = resolvedActorRole !== "reader";
  const published = entry.lifecycle.state === "published";
  const hasMembership = Boolean(userState?.membershipPlanId);
  const purchased = Boolean(userState?.latestPaidOrderId);
  const visibilityAccessible =
    entry.visibility === "public" ||
    entry.visibility === "login_required" ||
    (entry.visibility === "member_only" && hasMembership) ||
    (entry.visibility === "purchased_only" && purchased);

  return {
    visibility: entry.visibility,
    accessible: entry.lifecycle.state !== "deleted" && (privileged || (published && visibilityAccessible)),
    previewAvailable: entry.lifecycle.state !== "deleted",
    requiresLogin: entry.visibility === "login_required",
    requiresMembership: entry.visibility === "member_only",
    requiresPurchase: entry.visibility === "purchased_only",
    ...(entry.visibility === "purchased_only" ? { purchased } : {}),
    summaryLabel:
      !published && !privileged
        ? "Not yet available to readers."
        : entry.visibility === "public"
          ? "Visible to everyone."
          : entry.visibility === "login_required"
            ? "Visible after sign-in."
            : entry.visibility === "member_only"
              ? "Visible to members only."
              : "Visible after purchase only.",
    ...(entry.visibility === "member_only"
      ? { entitlementLabel: "Membership access" }
      : entry.visibility === "purchased_only"
        ? { entitlementLabel: "Purchase access" }
        : {}),
    ...(!published && !privileged
      ? { gateLabel: "Content is unavailable until review and publication are complete." }
      : entry.visibility !== "public"
        ? { gateLabel: "Access is gated by the current visibility rule." }
        : {}),
  };
}

function createManagedContentDetail(
  contentId: string,
  userState?: UserState,
  actorRole?: ContentActorRole,
): ContentDetail | undefined {
  const entry = resolveManagedContentEntry(contentId, userState);
  const card = createManagedContentCard(contentId, userState, actorRole);
  if (!card || !entry) {
    return undefined;
  }

  const permissions = createManagedContentPermissions(entry, actorRole);
  const attachments = resolveManagedContentAttachments(entry, userState);

  return {
    ...card,
    recommendationReason: `Lifecycle status: ${card.lifecycle.state}.`,
    bodyPreview: entry.bodyPreview ?? `${card.summary} Lifecycle state: ${card.lifecycle.state}.`,
    ...(actorRole && actorRole !== "reader" ? { authoring: cloneManagedContentAuthoring(entry.authoring) } : {}),
    ...(attachments.length > 0 ? { attachments } : {}),
    reviewRecord: cloneManagedContentReviewRecord(entry.reviewRecord),
    permissions,
    ...(permissions.canViewAuditHistory ? { auditHistory: cloneManagedContentAuditHistory(entry.auditHistory) } : {}),
  };
}

export function getManagedContentDetail(
  input: string | GetContentDetailRequest,
  userState: UserState,
): ContentDetailResponse | undefined {
  const request = typeof input === "string" ? { contentId: input } : input;
  const contentDetail = createManagedContentDetail(request.contentId, userState, request.actorRole);
  const contentAccess = createManagedContentAccess(request.contentId, userState, request.actorRole);
  if (!contentDetail || !contentAccess) {
    return undefined;
  }

  return {
    contentDetail,
    contentAccess,
  };
}

function createManagedContentQueue(
  userState: UserState,
  input: ListContentReviewQueueRequest = {},
): ContentReviewQueue {
  const items = Object.entries(userState.managedContentById ?? createDefaultManagedContentEntries())
    .filter(([, entry]) => (input.state && input.state !== "all" ? entry.lifecycle.state === input.state : true))
    .filter(([, entry]) => entry.reviewRecord.status === "queued" || entry.lifecycle.state === "under_review")
    .sort((left, right) => (right[1].reviewRecord.submittedAt ?? "").localeCompare(left[1].reviewRecord.submittedAt ?? ""))
    .map(([contentId, entry]) => ({
      contentId,
      model: entry.model,
      title: entry.title,
      lifecycleState: entry.lifecycle.state,
      visibility: entry.visibility,
      authorLabel: entry.authorLabel,
      queueLabel: entry.reviewRecord.queueLabel ?? "Review queue",
      attachmentsCount: entry.attachments.length,
      ...(entry.reviewRecord.submittedAt ? { submittedAt: entry.reviewRecord.submittedAt } : {}),
      ...(entry.reviewRecord.reviewerLabel ? { reviewerLabel: entry.reviewRecord.reviewerLabel } : {}),
    }));
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 10;
  const start = (page - 1) * pageSize;
  const pagedItems = items.slice(start, start + pageSize);

  return {
    items: pagedItems,
    page,
    pageSize,
    total: items.length,
    hasMore: start + pageSize < items.length,
    ...(pagedItems[0] ? { selectedContentId: pagedItems[0].contentId } : {}),
  };
}

export function listManagedContentReviewQueue(
  userState: UserState,
  input: ListContentReviewQueueRequest = {},
): ContentReviewQueueResponse {
  return {
    reviewQueue: createManagedContentQueue(userState, input),
  };
}

function createManagedContentResponse(
  contentId: string,
  userState: UserState,
  actorRole?: ContentActorRole,
  transitionMessage = "Content updated.",
): ManagedContentMutationResult<ContentLifecycleMutationResponse | SaveContentDraftResponse> {
  const contentCard = createManagedContentCard(contentId, userState, actorRole);
  const contentDetail = createManagedContentDetail(contentId, userState, actorRole);
  const contentAccess = createManagedContentAccess(contentId, userState, actorRole);
  if (!contentCard || !contentDetail || !contentAccess) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Managed content not found.",
    };
  }

  return {
    ok: true,
    value: {
      contentCard,
      contentDetail,
      contentAccess,
      transitionMessage,
    },
  };
}

function ensureManagedContentState(userState: UserState) {
  if (!userState.managedContentById) {
    userState.managedContentById = createDefaultManagedContentEntries();
  }
}

export function saveManagedContentDraft(
  userState: UserState,
  input: SaveContentDraftRequest,
): ManagedContentMutationResult<SaveContentDraftResponse> {
  ensureManagedContentState(userState);
  const managedContentById = userState.managedContentById!;
  const now = new Date().toISOString();
  const contentId = input.contentId ?? `content_${crypto.randomUUID()}`;
  const current = input.contentId ? resolveManagedContentEntry(contentId, userState) : undefined;
  const actorRole = resolveManagedContentActorRole(input.actorRole ?? "author");
  if (current) {
    const permissions = createManagedContentPermissions(current, actorRole);
    if (!permissions.canSaveDraft) {
      return {
        ok: false,
        code: "FORBIDDEN",
        message: "Current role cannot save this content draft.",
      };
    }
  }

  const attachmentAssetIds = input.attachmentAssetIds ?? current?.authoring.attachmentAssetIds ?? [];
  const next: ManagedContentEntry = {
    authorUserId: current?.authorUserId ?? "minix_user",
    model: input.model,
    visibility: input.visibility,
    lifecycle: {
      ...(current?.lifecycle ?? { state: "draft", availableActions: createManagedContentLifecycleActions("draft") }),
      state:
        current?.lifecycle.state === "published" || current?.lifecycle.state === "offline" || current?.lifecycle.state === "deleted"
          ? current.lifecycle.state
          : "draft",
      availableActions: createManagedContentLifecycleActions(
        current?.lifecycle.state === "published" || current?.lifecycle.state === "offline" || current?.lifecycle.state === "deleted"
          ? current.lifecycle.state
          : "draft",
      ),
      updatedAt: now,
      ...(current?.lifecycle.publishedAt ? { publishedAt: current.lifecycle.publishedAt } : {}),
      ...(current?.lifecycle.offlineAt ? { offlineAt: current.lifecycle.offlineAt } : {}),
    },
    authorLabel: current?.authorLabel ?? "MiniX Author Workspace",
    title: input.title,
    ...(input.subtitle ? { subtitle: input.subtitle } : {}),
    summary: input.summary,
    ...(input.bodyPreview ? { bodyPreview: input.bodyPreview } : {}),
    categoryKey: input.categoryKey,
    categoryLabel: input.categoryLabel,
    tags: input.tags.map((tag) => ({ key: tag.key, label: tag.label })),
    ...(input.coverAssetId ? { coverAssetId: input.coverAssetId } : {}),
    attachments: createManagedContentAttachments(contentId, attachmentAssetIds),
    reviewRecord: {
      ...(current?.reviewRecord ?? {
        reviewId: `review_${contentId}`,
        status: "not_requested" as ContentReviewRecord["status"],
        queueLabel: "Draft workspace",
      }),
      ...(current?.reviewRecord.decidedAt ? { decidedAt: current.reviewRecord.decidedAt } : {}),
      ...(current?.reviewRecord.reviewerLabel ? { reviewerLabel: current.reviewRecord.reviewerLabel } : {}),
      ...(current?.reviewRecord.assignedAt ? { assignedAt: current.reviewRecord.assignedAt } : {}),
      ...(current?.reviewRecord.submittedAt ? { submittedAt: current.reviewRecord.submittedAt } : {}),
    },
    auditHistory: [
      ...(current?.auditHistory ? cloneManagedContentAuditHistory(current.auditHistory) : []),
      createManagedContentAuditEntry({
        auditId: `audit_${contentId}_${current ? "save" : "create"}_${Date.now()}`,
        action: current ? "save_draft" : "create",
        actorRole,
        actorLabel: current?.authorLabel ?? "MiniX Author Workspace",
        createdAt: now,
        message: current ? "Draft saved with the latest authoring changes." : "Draft created in the CMS authoring workspace.",
      }),
    ],
    actorRoles: current?.actorRoles ?? ["author", "reviewer", "admin", "reader"],
    authoring: {
      title: input.title,
      ...(input.subtitle ? { subtitle: input.subtitle } : {}),
      summary: input.summary,
      ...(input.bodyPreview ? { bodyPreview: input.bodyPreview } : {}),
      visibility: input.visibility,
      category: { key: input.categoryKey, label: input.categoryLabel },
      tags: input.tags.map((tag) => ({ key: tag.key, label: tag.label })),
      ...(input.coverAssetId ? { coverAssetId: input.coverAssetId } : {}),
      attachmentAssetIds: [...attachmentAssetIds],
    },
  };

  managedContentById[contentId] = next;
  if (input.coverAssetId) {
    bindUploadAssetsToOwner(userState, {
      assetIds: [input.coverAssetId],
      ownerType: "content",
      ownerId: contentId,
      role: "cover",
      now,
    });
  }
  bindUploadAssetsToOwner(userState, {
    assetIds: attachmentAssetIds,
    ownerType: "content",
    ownerId: contentId,
    role: "attachment",
    now,
  });

  const response = createManagedContentResponse(
    contentId,
    userState,
    actorRole,
    current ? "Content draft saved." : "Content draft created.",
  );
  return response.ok ? { ok: true, value: response.value as SaveContentDraftResponse } : response;
}

export function applyManagedContentLifecycle(
  userState: UserState,
  input: ContentLifecycleMutationRequest,
): ManagedContentMutationResult<ContentLifecycleMutationResponse> {
  const current = resolveManagedContentEntry(input.contentId, userState);
  if (!current) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Managed content not found.",
    };
  }

  ensureManagedContentState(userState);

  const actorRole = resolveManagedContentActorRole(input.actorRole);
  const permissions = createManagedContentPermissions(current, actorRole);
  const next = structuredClone(current);
  const now = new Date().toISOString();

  switch (input.action) {
    case "publish":
      if (!(actorRole === "admin" || actorRole === "author")) {
        return { ok: false, code: "FORBIDDEN", message: "Current role cannot publish content." };
      }
      next.lifecycle.state = "published";
      next.reviewRecord.status = "approved";
      next.lifecycle.publishedAt = next.lifecycle.publishedAt ?? now;
      next.reviewRecord.decidedAt = now;
      next.reviewRecord.message = "Published from the sample CMS workflow.";
      delete next.lifecycle.offlineAt;
      delete next.lifecycle.reviewMessage;
      break;
    case "archive":
      if (!permissions.canArchive) {
        return { ok: false, code: "FORBIDDEN", message: "Current role cannot archive content." };
      }
      next.lifecycle.state = "offline";
      next.lifecycle.offlineAt = now;
      next.reviewRecord.queueLabel = "Offline queue";
      break;
    case "delete":
      if (!permissions.canDelete) {
        return { ok: false, code: "FORBIDDEN", message: "Current role cannot delete content." };
      }
      next.lifecycle.state = "deleted";
      break;
    case "restore":
      if (!permissions.canRestore) {
        return { ok: false, code: "FORBIDDEN", message: "Current role cannot restore content." };
      }
      next.lifecycle.state = "published";
      next.lifecycle.publishedAt = next.lifecycle.publishedAt ?? now;
      delete next.lifecycle.offlineAt;
      next.reviewRecord.status = "approved";
      next.reviewRecord.decidedAt = now;
      break;
    case "submit_review":
      if (!permissions.canSubmitReview) {
        return { ok: false, code: "FORBIDDEN", message: "Current role cannot submit content for review." };
      }
      next.lifecycle.state = "under_review";
      next.lifecycle.reviewMessage = input.reviewMessage ?? "Submitted for review.";
      next.reviewRecord.status = "queued";
      next.reviewRecord.queueLabel = "Review queue";
      next.reviewRecord.submittedAt = now;
      next.reviewRecord.assignedAt = now;
      next.reviewRecord.reviewerLabel = "Reviewer Mina";
      next.reviewRecord.message = input.reviewMessage ?? "Submitted for review.";
      next.auditHistory.push(
        createManagedContentAuditEntry({
          auditId: `audit_${input.contentId}_assign_${Date.now()}`,
          action: "assign_review",
          actorRole: "reviewer",
          actorLabel: "Reviewer Mina",
          createdAt: now,
          message: "Content assigned into the review queue.",
        }),
      );
      break;
    case "approve_review":
      if (!permissions.canApproveReview) {
        return { ok: false, code: "FORBIDDEN", message: "Current role cannot approve content review." };
      }
      next.lifecycle.state = "published";
      next.reviewRecord.status = "approved";
      next.reviewRecord.decidedAt = now;
      next.reviewRecord.message = input.reviewMessage ?? "Review approved.";
      next.lifecycle.publishedAt = next.lifecycle.publishedAt ?? now;
      delete next.lifecycle.reviewMessage;
      break;
    case "reject_review":
      if (!permissions.canRejectReview) {
        return { ok: false, code: "FORBIDDEN", message: "Current role cannot reject content review." };
      }
      next.lifecycle.state = "review_rejected";
      next.lifecycle.reviewMessage = input.reviewMessage ?? "Review rejected in sample workflow.";
      next.reviewRecord.status = "rejected";
      next.reviewRecord.decidedAt = now;
      next.reviewRecord.message = input.reviewMessage ?? "Review rejected in sample workflow.";
      break;
    case "change_visibility":
      if (!permissions.canChangeVisibility) {
        return { ok: false, code: "FORBIDDEN", message: "Current role cannot change content visibility." };
      }
      if (input.visibility) {
        next.visibility = input.visibility;
        next.authoring.visibility = input.visibility;
      }
      break;
    case "update":
      if (!permissions.canEdit) {
        return { ok: false, code: "FORBIDDEN", message: "Current role cannot update content." };
      }
      if (input.reviewMessage) {
        next.summary = input.reviewMessage;
        next.authoring.summary = input.reviewMessage;
      }
      break;
  }

  next.lifecycle.availableActions = createManagedContentLifecycleActions(next.lifecycle.state);
  next.lifecycle.updatedAt = now;
  next.auditHistory.push(
    createManagedContentAuditEntry({
      auditId: `audit_${input.contentId}_${input.action}_${Date.now()}`,
      action: input.action,
      actorRole,
      actorLabel:
        actorRole === "reviewer" ? "Reviewer Mina" : actorRole === "admin" ? "Ops Admin" : current.authorLabel,
      createdAt: now,
      message:
        input.action === "change_visibility"
          ? `Visibility changed to ${next.visibility}.`
          : input.reviewMessage ?? `Lifecycle action ${input.action} applied.`,
    }),
  );
  userState.managedContentById![input.contentId] = next;

  const response = createManagedContentResponse(
    input.contentId,
    userState,
    actorRole,
    input.action === "change_visibility"
      ? "Content visibility updated."
      : input.action === "submit_review"
        ? "Content submitted for review."
        : input.action === "approve_review"
          ? "Content review approved."
          : input.action === "reject_review"
            ? "Content review rejected."
            : input.action === "archive"
              ? "Content archived."
              : input.action === "restore"
                ? "Content restored."
                : input.action === "delete"
                  ? "Content deleted."
                  : input.action === "publish"
                    ? "Content published."
                    : "Content updated.",
  );
  return response.ok ? { ok: true, value: response.value as ContentLifecycleMutationResponse } : response;
}

function resolveSearchDomain(inputDomain: string | undefined, fallback: SearchDomain): SearchDomain {
  if (inputDomain === "all" || inputDomain === "content" || inputDomain === "user" || inputDomain === "novel" || inputDomain === "feed") {
    return inputDomain;
  }

  return fallback;
}

export function listFeed(input: {
  page?: number | undefined;
  pageSize?: number | undefined;
  keyword?: string | undefined;
  tag?: string | undefined;
  mode?: string | undefined;
  domain?: string | undefined;
  sort?: string | undefined;
}, userState?: UserState): FeedListResponse {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 6;
  const keyword = input.keyword?.trim() ?? "";
  const normalizedKeyword = keyword.toLowerCase();
  const mode = input.mode === "content" || input.mode === "user" || input.mode === "domain" ? input.mode : "global";
  const domain = resolveSearchDomain(input.domain, "feed");
  const activeSortKey = resolveFeedSortKey(input.sort);

  if (mode !== "global" || domain !== "feed") {
    return createUnifiedFeedResults(
      {
        page,
        pageSize,
        keyword,
        mode,
        domain,
        ...(input.sort ? { sort: input.sort } : {}),
        ...(input.tag ? { tag: input.tag } : {}),
      },
      userState,
    );
  }

  const hotKeywords = ["travel", "speaking", "listening", "review"];
  const allItems = createFeedItems(userState);
  const allTags = [{ key: "all", label: "All" }, ...Array.from(new Map(allItems.map((item) => {
    const tag = resolveFeedTag(item.id);
    return [tag.key, tag];
  })).values())];

  let filteredItems = allItems;
  if (input.tag && input.tag !== "all") {
    filteredItems = filteredItems.filter((item) => item.tag === input.tag);
  }

  if (normalizedKeyword) {
    filteredItems = filteredItems.filter((item) =>
      [item.title, item.subtitle, item.eyebrow, item.recommendedReason].some((value) =>
        value?.toLowerCase().includes(normalizedKeyword),
      ),
    );
  }

  filteredItems = decorateSearchItems(sortFeedItems(filteredItems, activeSortKey), activeSortKey, keyword);

  const start = (page - 1) * pageSize;
  const items = filteredItems.slice(start, start + pageSize);
  const hasMore = start + pageSize < filteredItems.length;
  const correctionKeyword = filteredItems.length === 0 ? createCorrectionKeyword(keyword, hotKeywords) : undefined;

  return {
    items,
    page,
    pageSize,
    hasMore,
    tags: allTags,
    ...(items[0]?.recommendedReason ? { featuredReason: items[0].recommendedReason } : {}),
    searchQuery: {
      keyword,
      mode,
      domain,
      page,
      pageSize,
      ...(activeSortKey !== "recommended" ? { sortKey: activeSortKey } : {}),
    },
    searchFilters: createFeedSearchFilters(allItems, input.tag),
    searchResults: createFeedSearchResults(
      items,
      filteredItems.length,
      hasMore,
      keyword ? `No feed results matched "${keyword}".` : "No feed items are available yet.",
      hotKeywords,
      activeSortKey,
      keyword,
      {
        ...(correctionKeyword ? { correctionKeyword } : {}),
        ...(correctionKeyword ? { correctionReason: `No exact feed matches for "${keyword}".` } : {}),
      },
    ),
  };
}

export function listNovels(
  input: {
    page?: number | undefined;
    pageSize?: number | undefined;
    categoryKey?: string | undefined;
    status?: string | undefined;
    keyword?: string | undefined;
    sort?: string | undefined;
  },
  membershipActive: boolean,
  userState: UserState,
  requestUrl?: string,
): NovelListResponse {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 6;
  const keyword = input.keyword?.trim() ?? "";
  const normalizedKeyword = keyword.toLowerCase();
  const sort = input.sort ?? "recommended";

  const allCards = NOVELS.map((detail) => toNovelCard(detail, membershipActive, userState, requestUrl));
  let cards = [...allCards];

  if (input.categoryKey && input.categoryKey !== "all") {
    cards = cards.filter((item) => item.categoryKey === input.categoryKey);
  }

  if (input.status && input.status !== "all") {
    cards = cards.filter((item) => item.status === input.status);
  }

  if (normalizedKeyword) {
    cards = cards.filter((item) =>
      [item.title, item.authorName, item.summary].some((value) => value.toLowerCase().includes(normalizedKeyword)),
    );
  }

  if (sort === "updatedAt") {
    cards.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  } else if (sort === "popular") {
    cards.sort((left, right) => (right.readingCount ?? 0) - (left.readingCount ?? 0));
  } else if (sort === "wordCount") {
    cards.sort((left, right) => right.wordCount - left.wordCount);
  }

  const start = (page - 1) * pageSize;
  const items = cards.slice(start, start + pageSize);
  const hasMore = start + pageSize < cards.length;
  const hotKeywords = ["lantern", "brocade", "sword", "orchid"];
  return {
    items,
    page,
    pageSize,
    hasMore,
    searchQuery: {
      keyword,
      mode: "domain",
      domain: "novel",
      page,
      pageSize,
    },
    searchFilters: createNovelSearchFilters(allCards, input),
    searchResults: createNovelSearchResults(
      items,
      cards.length,
      hasMore,
      keyword ? `No novels matched "${keyword}".` : "No novels found yet.",
      hotKeywords,
      sort,
      keyword,
    ),
  };
}

function createBookshelfItem(
  detail: NovelDetail,
  userState: UserState,
  membershipActive: boolean,
  requestUrl?: string,
): BookshelfItem {
  const resolvedDetail = resolveNovelDetail(detail, membershipActive, userState.bookshelfNovelIds, requestUrl);
  const progress = userState.progressByNovelId[detail.id];
  const continueChapterId = progress?.chapterId ?? resolvedDetail.continueChapterId ?? resolvedDetail.firstChapterId;
  const continueChapterTitle = continueChapterId ? CHAPTER_CONTENT[continueChapterId]?.title : undefined;
  const latestChapterId = resolvedDetail.latestChapter?.id;

  return {
    novelId: resolvedDetail.id,
    title: resolvedDetail.title,
    authorName: resolvedDetail.author.name,
    ...(resolvedDetail.coverUrl ? { coverUrl: resolvedDetail.coverUrl } : {}),
    ...(resolvedDetail.latestChapter?.title ? { latestChapterTitle: resolvedDetail.latestChapter.title } : {}),
    ...(continueChapterId ? { continueChapterId } : {}),
    ...(continueChapterTitle ? { continueChapterTitle } : {}),
    ...(progress?.progressPercent !== undefined ? { progressPercent: progress.progressPercent } : {}),
    updatedAt: progress?.updatedAt ?? resolvedDetail.latestChapter?.updatedAt ?? "2026-03-22T08:00:00.000Z",
    hasUpdate: Boolean(latestChapterId && continueChapterId && latestChapterId !== continueChapterId),
  };
}

export function createBookshelf(
  userState: UserState,
  membershipActive: boolean,
  requestUrl?: string,
): BookshelfResponse {
  return {
    items: NOVELS.filter((detail) => userState.bookshelfNovelIds.has(detail.id))
      .map((detail) => createBookshelfItem(detail, userState, membershipActive, requestUrl))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  };
}

export function deriveReturnTarget(source?: string): "catalog" | "detail" | "reader" {
  if (source === "reader") {
    return "reader";
  }

  if (source === "detail") {
    return "detail";
  }

  return "catalog";
}

interface NotificationSeed {
  id: string;
  type: NotificationType;
  groupKey: string;
  groupLabel: string;
  title: string;
  summary: string;
  bodyPreview?: string;
  createdAt: string;
  updatedAt?: string;
  pinned: boolean;
  doNotDisturb: boolean;
  tagLabels: string[];
  threadId?: string;
}

function createTouchpointTemplateKey(scope: string, channel: MessageTouchpointChannel) {
  return `${scope}.${channel}`;
}

function createBaseTouchpoint(
  channel: MessageTouchpointChannel,
  scope: string,
  label: string,
  mode: MessageTouchpointProviderMode = "sample",
): MessageTouchpoint {
  if (channel === "in_app") {
    return {
      channel,
      executable: true,
      enabled: true,
      delivered: true,
      statusLabel: "Visible in the in-app inbox",
      providerKey: "station_inbox",
      providerLabel: "Station Inbox",
      providerMode: mode,
      fallbackToInApp: false,
      templateKey: createTouchpointTemplateKey(scope, channel),
      template: {
        templateKey: createTouchpointTemplateKey(scope, channel),
        locale: "zh-CN",
        title: label,
        channelConstraint: channel,
      },
      receipt: {
        receiptId: `receipt_${scope}_${channel}`,
        status: "delivered",
        attemptedAt: "2026-04-01T08:00:00.000Z",
        deliveredAt: "2026-04-01T08:00:00.000Z",
        retryCount: 0,
        retryable: false,
      },
    };
  }

  const provider = NOTIFICATION_CHANNEL_PROVIDER_CONFIG[channel];
  return {
    channel,
    executable: true,
    enabled: provider.defaultEnabled,
    statusLabel: `${provider.providerLabel} is available for ${channel.replace("_", " ")} delivery.`,
    providerKey: provider.providerKey,
    providerLabel: provider.providerLabel,
    providerMode: mode,
    fallbackToInApp: provider.fallbackToInApp,
    unsubscribable: channel !== "push",
    unsubscribeKey: `notifications.${channel}`,
    templateKey: createTouchpointTemplateKey(scope, channel),
    template: {
      templateKey: createTouchpointTemplateKey(scope, channel),
      locale: provider.locale,
      title: label,
      channelConstraint: channel,
    },
  };
}

const DEFAULT_MESSAGE_TOUCHPOINTS: MessageTouchpoint[] = [
  createBaseTouchpoint("in_app", "messages.default", "Default inbox delivery"),
  createBaseTouchpoint("subscription_message", "messages.default", "Default subscription delivery"),
  createBaseTouchpoint("sms", "messages.default", "Default SMS delivery"),
  createBaseTouchpoint("email", "messages.default", "Default email delivery"),
  createBaseTouchpoint("push", "messages.default", "Default push delivery"),
];

const MESSAGE_POLL_INTERVAL_MS = 5_000;

const THREAD_SEEDS: Record<string, MessageThread> = {
  thread_private_tutor: {
    threadId: "thread_private_tutor",
    type: "private",
    title: "Tutor Mila",
    subtitle: "Private coaching thread",
    participantLabels: ["Tutor Mila", "You"],
    pinned: true,
    doNotDisturb: false,
    unreadCount: 2,
    lastMessagePreview: "I left pronunciation notes on your latest speaking task.",
    lastMessageAt: "2026-04-08T09:10:00.000Z",
    lastReadAt: "2026-04-08T08:40:00.000Z",
    reserved: true,
    touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    replyPolicy: "open",
    members: [
      { userId: "creator_sample", label: "Tutor Mila", role: "advisor", active: true, canReply: true, joinedAt: "2026-04-01T08:00:00.000Z" },
      { userId: "self", label: "You", role: "customer", active: true, canReply: true, joinedAt: "2026-04-01T08:00:00.000Z" },
    ],
  },
  thread_consultation_case: {
    threadId: "thread_consultation_case",
    type: "consultation",
    title: "Consultation Desk",
    subtitle: "Reserved consultation workflow thread",
    participantLabels: ["Consultation Desk", "You"],
    pinned: false,
    doNotDisturb: false,
    unreadCount: 1,
    lastMessagePreview: "Your consultation request is queued for an advisor reply.",
    lastMessageAt: "2026-04-08T07:55:00.000Z",
    lastReadAt: "2026-04-08T06:30:00.000Z",
    reserved: true,
    touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    replyPolicy: "open",
    assignment: {
      assigneeUserId: "advisor_oncall_1",
      assigneeLabel: "Advisor Nia",
      teamLabel: "Consultation Desk",
      assignedAt: "2026-04-08T07:50:00.000Z",
      statusLabel: "Advisor assigned",
    },
    consultationProgress: {
      caseId: "consult_case_1",
      state: "assigned",
      advisorLabel: "Advisor Nia",
      nextStepLabel: "Reply in-thread to keep the consultation active.",
    },
    members: [
      { userId: "advisor_oncall_1", label: "Advisor Nia", role: "advisor", active: true, canReply: true, joinedAt: "2026-04-08T07:50:00.000Z" },
      { userId: "self", label: "You", role: "customer", active: true, canReply: true, joinedAt: "2026-04-08T07:42:00.000Z" },
    ],
  },
  thread_customer_service: {
    threadId: "thread_customer_service",
    type: "customer_service",
    title: "Customer Support",
    subtitle: "Reserved customer-service thread",
    participantLabels: ["Support Bot", "You"],
    pinned: false,
    doNotDisturb: true,
    unreadCount: 0,
    lastMessagePreview: "Your billing question was marked resolved.",
    lastMessageAt: "2026-04-07T18:20:00.000Z",
    lastReadAt: "2026-04-07T18:25:00.000Z",
    reserved: true,
    touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    replyPolicy: "open",
    assignment: {
      assigneeUserId: "support_agent_1",
      assigneeLabel: "Support Bot",
      teamLabel: "Billing Support",
      assignedAt: "2026-04-07T18:10:00.000Z",
      statusLabel: "Assigned to billing support",
    },
    supportProgress: {
      ticketId: "fb_seed_support",
      state: "resolved",
      queueLabel: "Billing Support",
      assigneeLabel: "Support Bot",
      nextStepLabel: "Reply to reopen this support conversation.",
    },
    members: [
      { userId: "support_agent_1", label: "Support Bot", role: "support_agent", active: true, canReply: true, joinedAt: "2026-04-07T18:10:00.000Z" },
      { userId: "self", label: "You", role: "customer", active: true, canReply: true, joinedAt: "2026-04-07T18:10:00.000Z" },
    ],
  },
  thread_group_members: {
    threadId: "thread_group_members",
    type: "group",
    title: "Member Circle (Reserved)",
    subtitle: "Reserved group-chat contract surface",
    participantLabels: ["Community Host", "You", "12 members"],
    pinned: false,
    doNotDisturb: true,
    unreadCount: 3,
    lastMessagePreview: "Weekly challenge picks are ready to review.",
    lastMessageAt: "2026-04-08T08:05:00.000Z",
    lastReadAt: "2026-04-07T21:20:00.000Z",
    reserved: true,
    touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    replyPolicy: "readonly",
    groupState: {
      memberCount: 12,
      userMember: false,
      replyPolicy: "readonly",
      readonlyReason: "Join the member circle before replying in the group lane.",
    },
    members: [
      { userId: "community_host_1", label: "Community Host", role: "owner", active: true, canReply: true, joinedAt: "2026-04-01T08:00:00.000Z" },
    ],
  },
};

const THREAD_MESSAGE_SEEDS: Record<string, MessageBodyItem[]> = {
  thread_private_tutor: [
    {
      messageId: "msg_private_1",
      threadId: "thread_private_tutor",
      direction: "inbound",
      senderRole: "advisor",
      senderLabel: "Tutor Mila",
      body: "I left pronunciation notes on your latest speaking task.",
      createdAt: "2026-04-08T09:10:00.000Z",
      deliveryStatus: "delivered",
      deliveredAt: "2026-04-08T09:10:05.000Z",
      attemptCount: 1,
      retryable: false,
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
    {
      messageId: "msg_private_2",
      threadId: "thread_private_tutor",
      direction: "inbound",
      senderRole: "advisor",
      senderLabel: "Tutor Mila",
      body: "Reply here if you want me to review your next recording tonight.",
      createdAt: "2026-04-08T09:12:00.000Z",
      deliveryStatus: "delivered",
      deliveredAt: "2026-04-08T09:12:04.000Z",
      attemptCount: 1,
      retryable: false,
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
  ],
  thread_consultation_case: [
    {
      messageId: "msg_consult_1",
      threadId: "thread_consultation_case",
      direction: "outbound",
      senderRole: "self",
      senderLabel: "You",
      body: "I need advice on the premium reading workflow for our consultation flow.",
      createdAt: "2026-04-08T07:42:00.000Z",
      deliveryStatus: "read",
      deliveredAt: "2026-04-08T07:43:00.000Z",
      readAt: "2026-04-08T07:44:00.000Z",
      attemptCount: 1,
      retryable: false,
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
    {
      messageId: "msg_consult_2",
      threadId: "thread_consultation_case",
      direction: "inbound",
      senderRole: "advisor",
      senderLabel: "Consultation Desk",
      body: "Your consultation request is queued for an advisor reply.",
      createdAt: "2026-04-08T07:55:00.000Z",
      deliveryStatus: "delivered",
      deliveredAt: "2026-04-08T07:55:03.000Z",
      attemptCount: 1,
      retryable: false,
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
  ],
  thread_customer_service: [
    {
      messageId: "msg_support_1",
      threadId: "thread_customer_service",
      direction: "outbound",
      senderRole: "self",
      senderLabel: "You",
      body: "Can you confirm whether my billing question was resolved?",
      createdAt: "2026-04-07T18:10:00.000Z",
      deliveryStatus: "read",
      deliveredAt: "2026-04-07T18:11:00.000Z",
      readAt: "2026-04-07T18:12:00.000Z",
      attemptCount: 1,
      retryable: false,
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
    {
      messageId: "msg_support_2",
      threadId: "thread_customer_service",
      direction: "inbound",
      senderRole: "support",
      senderLabel: "Support Bot",
      body: "Your billing question was marked resolved.",
      createdAt: "2026-04-07T18:20:00.000Z",
      deliveryStatus: "read",
      deliveredAt: "2026-04-07T18:20:02.000Z",
      readAt: "2026-04-07T18:25:00.000Z",
      attemptCount: 1,
      retryable: false,
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
  ],
  thread_group_members: [
    {
      messageId: "msg_group_1",
      threadId: "thread_group_members",
      direction: "inbound",
      senderRole: "peer",
      senderLabel: "Community Host",
      body: "Weekly challenge picks are ready to review.",
      createdAt: "2026-04-08T08:05:00.000Z",
      deliveryStatus: "delivered",
      deliveredAt: "2026-04-08T08:05:02.000Z",
      attemptCount: 1,
      retryable: false,
      touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    },
  ],
};

const NOTIFICATION_SEEDS: NotificationSeed[] = [
  {
    id: "notice_system_security",
    type: "system",
    groupKey: "security",
    groupLabel: "Security",
    title: "New device sign-in detected",
    summary: "A new H5 session was created for your account. Review the session if this was not you.",
    bodyPreview: "Security events surface here before vendor-backed push or SMS delivery is added.",
    createdAt: "2026-04-08T09:25:00.000Z",
    updatedAt: "2026-04-08T09:25:00.000Z",
    pinned: true,
    doNotDisturb: false,
    tagLabels: ["security", "session"],
    threadId: "thread_customer_service",
  },
  {
    id: "notice_business_payment",
    type: "business",
    groupKey: "orders",
    groupLabel: "Orders",
    title: "Membership payment confirmed",
    summary: "Your membership entitlement is active and premium reading has been unlocked.",
    bodyPreview: "This item links the order/payment foundation into the shared inbox model.",
    createdAt: "2026-04-08T08:50:00.000Z",
    updatedAt: "2026-04-08T08:52:00.000Z",
    pinned: true,
    doNotDisturb: false,
    tagLabels: ["payment", "entitlement"],
  },
  {
    id: "notice_campaign_challenge",
    type: "campaign",
    groupKey: "growth",
    groupLabel: "Growth",
    title: "Seven-day speaking challenge is live",
    summary: "Invite a friend or join the reserved member group to start the next challenge.",
    bodyPreview: "Campaign notices keep attribution-friendly metadata in a shared structure.",
    createdAt: "2026-04-08T07:40:00.000Z",
    pinned: false,
    doNotDisturb: false,
    tagLabels: ["campaign", "invite"],
    threadId: "thread_group_members",
  },
  {
    id: "notice_review_article",
    type: "review",
    groupKey: "moderation",
    groupLabel: "Moderation",
    title: "Your draft feedback was approved",
    summary: "The editorial review step is complete and the content is now visible.",
    bodyPreview: "Review notices reserve the moderation lane before the general content workflow lands.",
    createdAt: "2026-04-08T07:05:00.000Z",
    pinned: false,
    doNotDisturb: false,
    tagLabels: ["review", "content"],
  },
  {
    id: "notice_business_consultation",
    type: "business",
    groupKey: "consultation",
    groupLabel: "Consultation",
    title: "Consultation reply received",
    summary: "An advisor replied to your latest consultation request.",
    bodyPreview: "Conversation threads stay separate from notifications, but this notice can reference one.",
    createdAt: "2026-04-07T21:15:00.000Z",
    pinned: false,
    doNotDisturb: false,
    tagLabels: ["consultation", "advisor"],
    threadId: "thread_consultation_case",
  },
  {
    id: "notice_system_learning",
    type: "system",
    groupKey: "learning",
    groupLabel: "Learning",
    title: "Daily plan is ready",
    summary: "Overview and today's plan have been refreshed with a new practice queue.",
    createdAt: "2026-04-07T20:45:00.000Z",
    pinned: false,
    doNotDisturb: true,
    tagLabels: ["plan", "overview"],
  },
  {
    id: "notice_review_profile",
    type: "review",
    groupKey: "account",
    groupLabel: "Account",
    title: "Profile update under review",
    summary: "Your new profile description is being reviewed before it appears publicly.",
    createdAt: "2026-04-07T18:10:00.000Z",
    pinned: false,
    doNotDisturb: false,
    tagLabels: ["profile", "review"],
  },
];

function ensureNotificationTouchpointState(userState: UserState) {
  userState.notificationTouchpointReceiptsByNotificationId ??= {};
  return userState.notificationTouchpointReceiptsByNotificationId;
}

function resolveChannelPreference(
  userState: UserState | undefined,
  channel: Exclude<MessageTouchpointChannel, "in_app">,
) {
  const settingsState = resolveSettingsState(userState ?? createDefaultUserState(), undefined);
  return settingsState.notificationChannels.find((item) => item.channel === channel);
}

function createStoredReceiptRecord(input: {
  receiptId: string;
  channel: Exclude<MessageTouchpointChannel, "in_app">;
  providerKey: string;
  templateKey: string;
  locale: string;
  status: MessageTouchpointReceiptStatus;
  attemptedAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  failureCode?: string;
  failureMessage?: string;
  retryCount?: number;
  retryable?: boolean;
  nextRetryAt?: string;
  providerReference?: string;
}): StoredNotificationTouchpointRecord {
  return {
    receiptId: input.receiptId,
    channel: input.channel,
    providerKey: input.providerKey,
    templateKey: input.templateKey,
    locale: input.locale,
    status: input.status,
    retryCount: input.retryCount ?? 0,
    retryable: input.retryable ?? false,
    ...(input.attemptedAt ? { attemptedAt: input.attemptedAt } : {}),
    ...(input.deliveredAt ? { deliveredAt: input.deliveredAt } : {}),
    ...(input.failedAt ? { failedAt: input.failedAt } : {}),
    ...(input.failureCode ? { failureCode: input.failureCode } : {}),
    ...(input.failureMessage ? { failureMessage: input.failureMessage } : {}),
    ...(input.nextRetryAt ? { nextRetryAt: input.nextRetryAt } : {}),
    ...(input.providerReference ? { providerReference: input.providerReference } : {}),
  };
}

function shouldSimulateProviderFailure(channel: Exclude<MessageTouchpointChannel, "in_app">, body: string | undefined) {
  if (!body) {
    return false;
  }
  const normalized = body.toLowerCase();
  if (normalized.includes("provider-down")) {
    return true;
  }
  const keyword =
    channel === "subscription_message"
      ? "subscription"
      : channel;
  return normalized.includes(`${keyword}-fail`) || normalized.includes(`${keyword} fail`);
}

function createDispatchTouchpoint(
  userState: UserState | undefined,
  touchpoint: MessageTouchpoint,
  input: {
    resourceId: string;
    resourceLabel: string;
    createdAt?: string;
    body?: string;
    existingReceipt?: StoredNotificationTouchpointRecord;
    preferredStatus?: MessageTouchpointReceiptStatus;
  },
): MessageTouchpoint {
  if (touchpoint.channel === "in_app") {
    const attemptedAt = input.createdAt ?? "2026-04-01T08:00:00.000Z";
    return {
      ...touchpoint,
      executable: true,
      enabled: true,
      delivered: true,
      statusLabel: "Visible in the in-app inbox",
      receipt: {
        receiptId: input.existingReceipt?.receiptId ?? `receipt_${input.resourceId}_in_app`,
        status: "delivered",
        attemptedAt,
        deliveredAt: attemptedAt,
        retryCount: 0,
        retryable: false,
        ...(input.existingReceipt?.providerReference ? { providerReference: input.existingReceipt.providerReference } : {}),
      },
    };
  }

  const preference = resolveChannelPreference(userState, touchpoint.channel);
  const attemptedAt = input.createdAt ?? input.existingReceipt?.attemptedAt ?? "2026-04-01T08:00:00.000Z";
  const providerKey = touchpoint.providerKey ?? preference?.providerKey ?? NOTIFICATION_CHANNEL_PROVIDER_CONFIG[touchpoint.channel].providerKey;
  const templateKey = touchpoint.template?.templateKey ?? touchpoint.templateKey ?? createTouchpointTemplateKey(input.resourceLabel, touchpoint.channel);
  const locale = touchpoint.template?.locale ?? preference?.locale ?? "zh-CN";
  if (!preference?.enabled) {
    return {
      ...touchpoint,
      enabled: false,
      delivered: false,
      statusLabel: preference?.unsubscribed
        ? `Unsubscribed from ${touchpoint.channel.replace("_", " ")} delivery.`
        : `Disabled by notification policy for ${touchpoint.channel.replace("_", " ")} delivery.`,
      templateKey,
      template: {
        templateKey,
        locale,
        ...(touchpoint.template?.title ? { title: touchpoint.template.title } : {}),
        channelConstraint: touchpoint.channel,
      },
      receipt: {
        receiptId: input.existingReceipt?.receiptId ?? `receipt_${input.resourceId}_${touchpoint.channel}`,
        status: preference?.unsubscribed ? "opted_out" : "skipped",
        attemptedAt,
        retryCount: input.existingReceipt?.retryCount ?? 0,
        retryable: false,
      },
    };
  }

  const failed = shouldSimulateProviderFailure(touchpoint.channel, input.body);
  const preferredStatus = input.preferredStatus ?? (failed ? "failed" : "delivered");
  return {
    ...touchpoint,
    enabled: true,
    delivered: preferredStatus === "delivered",
    statusLabel:
      preferredStatus === "failed"
        ? `${touchpoint.providerLabel ?? providerKey} is temporarily unavailable.`
        : `${touchpoint.providerLabel ?? providerKey} delivered through ${touchpoint.channel.replace("_", " ")}.`,
    templateKey,
    template: {
      templateKey,
      locale,
      ...(touchpoint.template?.title ? { title: touchpoint.template.title } : {}),
      channelConstraint: touchpoint.channel,
    },
    receipt: {
      receiptId: input.existingReceipt?.receiptId ?? `receipt_${input.resourceId}_${touchpoint.channel}`,
      status: preferredStatus,
      attemptedAt,
      ...(preferredStatus === "delivered" ? { deliveredAt: input.createdAt ?? attemptedAt } : {}),
      ...(preferredStatus === "failed" ? { failedAt: input.createdAt ?? attemptedAt } : {}),
      ...(preferredStatus === "failed" ? { failureCode: "PROVIDER_UNAVAILABLE" } : {}),
      ...(preferredStatus === "failed" ? { failureMessage: `${touchpoint.providerLabel ?? providerKey} is unavailable.` } : {}),
      retryCount: input.existingReceipt?.retryCount ?? 0,
      retryable: preferredStatus === "failed",
      ...(preferredStatus === "failed" ? { nextRetryAt: new Date(Date.parse(input.createdAt ?? attemptedAt) + 5 * 60 * 1000).toISOString() } : {}),
      providerReference: input.existingReceipt?.providerReference ?? `${providerKey}_${input.resourceId}`,
    },
  };
}

function cloneTouchpoints(
  touchpoints: MessageTouchpoint[],
  userState?: UserState,
  input?: {
    resourceId?: string;
    resourceLabel?: string;
    createdAt?: string;
    body?: string;
  },
): MessageTouchpoint[] {
  if (!input?.resourceId || !input.resourceLabel) {
    return touchpoints.map((touchpoint) => createDispatchTouchpoint(userState, touchpoint, {
      resourceId: `preview_${touchpoint.channel}`,
      resourceLabel: input?.resourceLabel ?? "preview",
      ...(input?.createdAt ? { createdAt: input.createdAt } : {}),
      ...(input?.body ? { body: input.body } : {}),
    }));
  }

  if (input.resourceId.startsWith("notification:")) {
    const resourceId = input.resourceId;
    const resourceLabel = input.resourceLabel;
    const notificationId = input.resourceId.replace(/^notification:/, "");
    const storedReceipts = ensureNotificationTouchpointState(userState ?? createDefaultUserState())[notificationId] ?? {};
    const nextTouchpoints = touchpoints.map((touchpoint) => {
      const existingReceipt =
        touchpoint.channel === "in_app"
          ? undefined
          : storedReceipts[touchpoint.channel];
      const nextTouchpoint = createDispatchTouchpoint(userState, touchpoint, {
        resourceId,
        resourceLabel,
        ...(input.createdAt ? { createdAt: input.createdAt } : {}),
        ...(input.body ? { body: input.body } : {}),
        ...(existingReceipt ? { existingReceipt } : {}),
        ...(existingReceipt ? { preferredStatus: existingReceipt.status } : {}),
      });
      if (touchpoint.channel !== "in_app" && nextTouchpoint.receipt) {
        storedReceipts[touchpoint.channel] = createStoredReceiptRecord({
          receiptId: nextTouchpoint.receipt.receiptId,
          channel: touchpoint.channel,
          providerKey: nextTouchpoint.providerKey ?? NOTIFICATION_CHANNEL_PROVIDER_CONFIG[touchpoint.channel].providerKey,
          templateKey: nextTouchpoint.template?.templateKey ?? nextTouchpoint.templateKey ?? createTouchpointTemplateKey(resourceLabel, touchpoint.channel),
          locale: nextTouchpoint.template?.locale ?? "zh-CN",
          status: nextTouchpoint.receipt.status,
          ...(nextTouchpoint.receipt.attemptedAt ? { attemptedAt: nextTouchpoint.receipt.attemptedAt } : {}),
          ...(nextTouchpoint.receipt.deliveredAt ? { deliveredAt: nextTouchpoint.receipt.deliveredAt } : {}),
          ...(nextTouchpoint.receipt.failedAt ? { failedAt: nextTouchpoint.receipt.failedAt } : {}),
          ...(nextTouchpoint.receipt.failureCode ? { failureCode: nextTouchpoint.receipt.failureCode } : {}),
          ...(nextTouchpoint.receipt.failureMessage ? { failureMessage: nextTouchpoint.receipt.failureMessage } : {}),
          retryCount: nextTouchpoint.receipt.retryCount,
          retryable: nextTouchpoint.receipt.retryable,
          ...(nextTouchpoint.receipt.nextRetryAt ? { nextRetryAt: nextTouchpoint.receipt.nextRetryAt } : {}),
          ...(nextTouchpoint.receipt.providerReference ? { providerReference: nextTouchpoint.receipt.providerReference } : {}),
        });
      }
      return nextTouchpoint;
    });
    ensureNotificationTouchpointState(userState ?? createDefaultUserState())[notificationId] = storedReceipts;
    return nextTouchpoints;
  }

  return touchpoints.map((touchpoint) =>
    createDispatchTouchpoint(userState, touchpoint, {
      resourceId: input.resourceId!,
      resourceLabel: input.resourceLabel!,
      ...(input.createdAt ? { createdAt: input.createdAt } : {}),
      ...(input.body ? { body: input.body } : {}),
      ...(touchpoint.channel !== "in_app" && touchpoint.receipt
        ? {
            existingReceipt: createStoredReceiptRecord({
              receiptId: touchpoint.receipt.receiptId,
              channel: touchpoint.channel,
              providerKey: touchpoint.providerKey ?? NOTIFICATION_CHANNEL_PROVIDER_CONFIG[touchpoint.channel].providerKey,
              templateKey: touchpoint.template?.templateKey ?? touchpoint.templateKey ?? createTouchpointTemplateKey(input.resourceLabel!, touchpoint.channel),
              locale: touchpoint.template?.locale ?? "zh-CN",
              status: touchpoint.receipt.status,
              ...(touchpoint.receipt.attemptedAt ? { attemptedAt: touchpoint.receipt.attemptedAt } : {}),
              ...(touchpoint.receipt.deliveredAt ? { deliveredAt: touchpoint.receipt.deliveredAt } : {}),
              ...(touchpoint.receipt.failedAt ? { failedAt: touchpoint.receipt.failedAt } : {}),
              ...(touchpoint.receipt.failureCode ? { failureCode: touchpoint.receipt.failureCode } : {}),
              ...(touchpoint.receipt.failureMessage ? { failureMessage: touchpoint.receipt.failureMessage } : {}),
              retryCount: touchpoint.receipt.retryCount,
              retryable: touchpoint.receipt.retryable,
              ...(touchpoint.receipt.nextRetryAt ? { nextRetryAt: touchpoint.receipt.nextRetryAt } : {}),
              ...(touchpoint.receipt.providerReference ? { providerReference: touchpoint.receipt.providerReference } : {}),
            }),
            preferredStatus: touchpoint.receipt.status,
          }
        : {}),
    }),
  );
}

function cloneThreadMembers(members: MessageThreadMember[]): MessageThreadMember[] {
  return members.map((member) => ({
    userId: member.userId,
    label: member.label,
    role: member.role,
    active: member.active,
    canReply: member.canReply,
    ...(member.joinedAt ? { joinedAt: member.joinedAt } : {}),
  }));
}

function cloneMessageThread(thread: MessageThread, userState?: UserState): MessageThread {
  return {
    ...thread,
    participantLabels: [...thread.participantLabels],
    touchpoints: cloneTouchpoints(thread.touchpoints, userState, {
      resourceId: `thread:${thread.threadId}`,
      resourceLabel: `thread.${thread.type}`,
      ...(thread.lastMessageAt ? { createdAt: thread.lastMessageAt } : {}),
    }),
    ...(thread.replyPolicy ? { replyPolicy: thread.replyPolicy } : {}),
    ...(thread.members ? { members: cloneThreadMembers(thread.members) } : {}),
    ...(thread.assignment ? { assignment: { ...thread.assignment } } : {}),
    ...(thread.consultationProgress ? { consultationProgress: { ...thread.consultationProgress } } : {}),
    ...(thread.supportProgress
      ? {
          supportProgress: {
            state: thread.supportProgress.state,
            ...(thread.supportProgress.ticketId ? { ticketId: thread.supportProgress.ticketId } : {}),
            ...(thread.supportProgress.queueLabel ? { queueLabel: thread.supportProgress.queueLabel } : {}),
            ...(thread.supportProgress.assigneeLabel ? { assigneeLabel: thread.supportProgress.assigneeLabel } : {}),
            ...(thread.supportProgress.nextStepLabel ? { nextStepLabel: thread.supportProgress.nextStepLabel } : {}),
          },
        }
      : {}),
    ...(thread.groupState ? { groupState: { ...thread.groupState } } : {}),
    ...(thread.syncState ? { syncState: { ...thread.syncState } } : {}),
  };
}

function cloneMessageBodyItem(message: MessageBodyItem, userState?: UserState): MessageBodyItem {
  return {
    ...message,
    ...(message.updatedAt ? { updatedAt: message.updatedAt } : {}),
    ...(message.readAt ? { readAt: message.readAt } : {}),
    ...(message.deliveredAt ? { deliveredAt: message.deliveredAt } : {}),
    ...(message.failureCode ? { failureCode: message.failureCode } : {}),
    ...(message.failureMessage ? { failureMessage: message.failureMessage } : {}),
    touchpoints: cloneTouchpoints(message.touchpoints, userState, {
      resourceId: `message:${message.messageId}`,
      resourceLabel: `message.${message.direction}`,
      createdAt: message.createdAt,
      body: message.body,
    }),
  };
}

function cloneMessageItems(messages: MessageBodyItem[], userState?: UserState): MessageBodyItem[] {
  return messages.map((message) => cloneMessageBodyItem(message, userState));
}

function createThreadSyncState(cursor: string, lastSyncedAt?: string) {
  return {
    mode: "polling" as const,
    cursor,
    recommendedPollIntervalMs: MESSAGE_POLL_INTERVAL_MS,
    recoverable: true,
    ...(lastSyncedAt ? { lastSyncedAt } : {}),
  };
}

function createThreadCursor(messages: MessageBodyItem[], thread: MessageThread, updatedAt: string) {
  return `${updatedAt}:${messages.length}:${thread.unreadCount}:${thread.lastMessageAt ?? "none"}`;
}

function ensureMessageRuntimeState(userState: UserState) {
  userState.threadRecordsById ??= {};
  for (const [threadId, seed] of Object.entries(THREAD_SEEDS)) {
    const existing = userState.threadRecordsById[threadId];
    if (!existing) {
      userState.threadRecordsById[threadId] = {
        thread: cloneMessageThread(seed, userState),
        messages: [],
        syncCursor: createThreadCursor(THREAD_MESSAGE_SEEDS[threadId] ?? [], seed, seed.lastMessageAt ?? new Date().toISOString()),
        updatedAt: seed.lastMessageAt ?? new Date().toISOString(),
      };
    }
  }
}

function getStoredThreadRecord(userState: UserState, threadId: string): StoredMessageThreadRecord | undefined {
  ensureMessageRuntimeState(userState);
  return userState.threadRecordsById[threadId];
}

function getAllThreadRecords(userState: UserState): StoredMessageThreadRecord[] {
  ensureMessageRuntimeState(userState);
  return Object.values(userState.threadRecordsById);
}

function getThreadMessages(userState: UserState, threadId: string): MessageBodyItem[] {
  const record = getStoredThreadRecord(userState, threadId);
  if (!record) {
    return [];
  }
  const seeded = THREAD_MESSAGE_SEEDS[threadId] ? cloneMessageItems(THREAD_MESSAGE_SEEDS[threadId], userState) : [];
  const storedMessages = cloneMessageItems(record.messages, userState);
  const lastReadAt = userState.threadReadAtById[threadId];
  const now = new Date().toISOString();
  let storedChanged = false;

  const nextStoredMessages = storedMessages.map((message) => {
    if (message.direction === "outbound" && message.deliveryStatus === "pending") {
      storedChanged = true;
      const nextTouchpoints = message.touchpoints.map((touchpoint) => {
        if (!touchpoint.receipt || touchpoint.channel === "in_app") {
          return touchpoint;
        }
        if (touchpoint.receipt.status === "sent" || touchpoint.receipt.status === "queued") {
          return {
            ...touchpoint,
            delivered: true,
            statusLabel: `${touchpoint.providerLabel ?? touchpoint.providerKey ?? touchpoint.channel} delivered through ${touchpoint.channel.replace("_", " ")}.`,
            receipt: {
              ...touchpoint.receipt,
              status: "delivered" as MessageTouchpointReceiptStatus,
              deliveredAt: now,
              retryable: false,
            },
          };
        }
        return touchpoint;
      });
      return {
        ...message,
        deliveryStatus: "delivered" as MessageDeliveryStatus,
        deliveredAt: now,
        retryable: false,
        updatedAt: now,
        touchpoints: nextTouchpoints,
      };
    }
    return message;
  });

  if (storedChanged) {
    record.messages = cloneMessageItems(nextStoredMessages, userState);
    userState.threadMessagesByThreadId[threadId] = cloneMessageItems(nextStoredMessages, userState);
    record.updatedAt = now;
  }

  return [...seeded, ...nextStoredMessages]
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .map((message) => {
      if (message.direction === "inbound" && lastReadAt && message.createdAt <= lastReadAt) {
        return {
          ...message,
          deliveryStatus: "read",
          readAt: lastReadAt,
        };
      }
      return message;
    });
}

function countUnreadThreadMessages(userState: UserState, threadId: string): number {
  const lastReadAt = userState.threadReadAtById[threadId];
  const messages = getThreadMessages(userState, threadId);
  return messages.filter((message) => {
    if (message.direction !== "inbound") {
      return false;
    }
    if (!lastReadAt) {
      return true;
    }
    return message.createdAt > lastReadAt;
  }).length;
}

function createMessageThreadActions(thread: MessageThread, messages: MessageBodyItem[] = []): MessageThreadActions {
  const canReply =
    thread.replyPolicy !== "readonly" &&
    !(thread.type === "group" && thread.groupState && (!thread.groupState.userMember || thread.groupState.replyPolicy === "readonly"));
  return {
    canReply,
    canMarkRead: thread.unreadCount > 0,
    canRetryFailed: messages.some((message) => message.direction === "outbound" && message.deliveryStatus === "failed" && message.retryable),
    canCreateThread: true,
    deliveryLabel:
      thread.type === "customer_service"
        ? "Customer-service delivery lane"
        : thread.type === "consultation"
          ? "Consultation thread delivery lane"
          : thread.type === "private"
            ? "Private message delivery lane"
            : "Polling group delivery lane",
  };
}

function deriveThreadState(userState: UserState, threadId: string): MessageThread | undefined {
  const record = getStoredThreadRecord(userState, threadId);
  if (!record) {
    return undefined;
  }
  const messages = getThreadMessages(userState, threadId);
  const lastMessage = messages[messages.length - 1];
  const unreadCount = countUnreadThreadMessages(userState, threadId);
  const nextThread: MessageThread = {
    ...cloneMessageThread(record.thread, userState),
    unreadCount,
    ...(lastMessage ? { lastMessagePreview: lastMessage.body } : {}),
    ...(lastMessage ? { lastMessageAt: lastMessage.createdAt } : {}),
    ...(userState.threadReadAtById[threadId] ? { lastReadAt: userState.threadReadAtById[threadId] } : {}),
  };
  const cursor = createThreadCursor(messages, nextThread, record.updatedAt);
  nextThread.syncState = createThreadSyncState(cursor, record.updatedAt);
  record.thread = cloneMessageThread(nextThread, userState);
  record.syncCursor = cursor;
  return cloneMessageThread(nextThread, userState);
}

function listMessageThreads(
  userState: UserState,
  input: {
    page?: number;
    pageSize?: number;
    type?: MessageThread["type"] | "all";
    onlyUnread?: boolean;
    sort?: MessageThreadListSort;
    sourceTicketId?: string;
  } = {},
): MessageThreadList {
  const allThreads = getAllThreadRecords(userState)
    .map((record) => deriveThreadState(userState, record.thread.threadId))
    .filter((thread): thread is MessageThread => Boolean(thread));
  const filtered = allThreads
    .filter((thread) => (input.type && input.type !== "all" ? thread.type === input.type : true))
    .filter((thread) => (input.onlyUnread ? thread.unreadCount > 0 : true))
    .filter((thread) => (input.sourceTicketId ? thread.supportProgress?.ticketId === input.sourceTicketId : true))
    .sort((left, right) => {
      if ((input.sort ?? "activity") === "unread") {
        return right.unreadCount - left.unreadCount || (right.lastMessageAt ?? "").localeCompare(left.lastMessageAt ?? "");
      }
      return (right.lastMessageAt ?? "").localeCompare(left.lastMessageAt ?? "") || right.unreadCount - left.unreadCount;
    });
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  const latestUpdatedAt = filtered[0]?.syncState?.lastSyncedAt ?? filtered[0]?.lastMessageAt ?? new Date().toISOString();
  return {
    items,
    page,
    pageSize,
    total: filtered.length,
    hasMore: start + pageSize < filtered.length,
    ...(items[0] ? { selectedThreadId: items[0].threadId } : {}),
    syncState: createThreadSyncState(
      `${filtered.length}:${filtered[0]?.syncState?.cursor ?? "none"}`,
      latestUpdatedAt,
    ),
  };
}

function createNotificationItem(seed: NotificationSeed, userState: UserState): NotificationItem {
  const readAt = userState.notificationReadAtById[seed.id];
  const thread = seed.threadId ? deriveThreadState(userState, seed.threadId) : undefined;

  return {
    id: seed.id,
    type: seed.type,
    groupKey: seed.groupKey,
    groupLabel: seed.groupLabel,
    title: seed.title,
    summary: seed.summary,
    ...(seed.bodyPreview ? { bodyPreview: seed.bodyPreview } : {}),
    createdAt: seed.createdAt,
    ...(seed.updatedAt ? { updatedAt: seed.updatedAt } : {}),
    pinned: seed.pinned,
    doNotDisturb: seed.doNotDisturb,
    receipt: {
      read: Boolean(readAt),
      ...(readAt ? { readAt } : {}),
      readReceiptRequired: true,
    },
    touchpoints: cloneTouchpoints(DEFAULT_MESSAGE_TOUCHPOINTS, userState, {
      resourceId: `notification:${seed.id}`,
      resourceLabel: `notification.${seed.type}`,
      createdAt: seed.createdAt,
      ...(seed.bodyPreview ? { body: seed.bodyPreview } : {}),
    }),
    tagLabels: [...seed.tagLabels],
    ...(thread
      ? {
          thread: {
            threadId: thread.threadId,
            type: thread.type,
            title: thread.title,
            ...(thread.lastMessagePreview ? { lastMessagePreview: thread.lastMessagePreview } : {}),
            reserved: thread.reserved,
          },
        }
      : {}),
  };
}

function sortNotifications(items: NotificationItem[]): NotificationItem[] {
  return [...items].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

function createNotificationGroups(items: NotificationItem[]): NotificationGroupSummary[] {
  return Array.from(
    items.reduce((map, item) => {
      const existing = map.get(item.groupKey);
      map.set(item.groupKey, {
        key: item.groupKey,
        label: item.groupLabel,
        count: (existing?.count ?? 0) + 1,
      });
      return map;
    }, new Map<string, NotificationGroupSummary>()),
  )
    .map(([, value]) => value)
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function createNotificationFilters(
  allItems: NotificationItem[],
  activeType: string | undefined,
  activeGroupKey: string | undefined,
  onlyUnread: boolean,
): NotificationFilterGroup[] {
  const typeCounts = NOTIFICATION_SEEDS.reduce<Record<string, number>>((counts, seed) => {
    counts[seed.type] = (counts[seed.type] ?? 0) + 1;
    return counts;
  }, {});
  const groupCounts = NOTIFICATION_SEEDS.reduce<Record<string, number>>((counts, seed) => {
    counts[seed.groupKey] = (counts[seed.groupKey] ?? 0) + 1;
    return counts;
  }, {});
  const groupLabels = new Map(NOTIFICATION_SEEDS.map((seed) => [seed.groupKey, seed.groupLabel]));

  return [
    {
      key: "type",
      label: "Type",
      selectedKeys: activeType && activeType !== "all" ? [activeType] : [],
      options: [
        { key: "all", label: "All", count: allItems.length },
        { key: "system", label: "System", count: typeCounts.system ?? 0 },
        { key: "business", label: "Business", count: typeCounts.business ?? 0 },
        { key: "campaign", label: "Campaign", count: typeCounts.campaign ?? 0 },
        { key: "review", label: "Review", count: typeCounts.review ?? 0 },
      ],
    },
    {
      key: "group",
      label: "Group",
      selectedKeys: activeGroupKey && activeGroupKey !== "all" ? [activeGroupKey] : [],
      options: [
        { key: "all", label: "All groups", count: allItems.length },
        ...Object.entries(groupCounts)
          .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
          .map(([key, count]) => ({
            key,
            label: groupLabels.get(key) ?? key,
            count,
          })),
      ],
    },
    {
      key: "state",
      label: "State",
      selectedKeys: onlyUnread ? ["unread"] : [],
      options: [
        { key: "all", label: "All", count: allItems.length },
        { key: "unread", label: "Unread", count: allItems.filter((item) => !item.receipt.read).length },
      ],
    },
  ];
}

function createUnreadBadge(userState: UserState): UnreadBadge {
  const notifications = sortNotifications(NOTIFICATION_SEEDS.map((seed) => createNotificationItem(seed, userState)));
  const notificationUnread = notifications.filter((item) => !item.receipt.read).length;
  const threadUnread = listMessageThreads(userState, { page: 1, pageSize: 100 }).items.reduce((total, thread) => total + thread.unreadCount, 0);
  const breakdown: Array<{ key: string; label: string; count: number }> = NOTIFICATION_TYPES
    .map((type) => ({
      key: type,
      label: `${type.slice(0, 1).toUpperCase()}${type.slice(1)}`,
      count: notifications.filter((item) => item.type === type && !item.receipt.read).length,
    }))
    .filter((entry) => entry.count > 0);

  if (threadUnread > 0) {
    breakdown.push({
      key: "threads",
      label: "Threads",
      count: threadUnread,
    });
  }

  return {
    totalUnread: notificationUnread + threadUnread,
    notificationUnread,
    threadUnread,
    breakdown,
    lastUpdatedAt: new Date().toISOString(),
  };
}

function createNotificationList(
  userState: UserState,
  input: {
    page?: number | undefined;
    pageSize?: number | undefined;
    type?: string | undefined;
    groupKey?: string | undefined;
    onlyUnread?: boolean | undefined;
  },
): NotificationList {
  const allItems = sortNotifications(NOTIFICATION_SEEDS.map((seed) => createNotificationItem(seed, userState)));
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 6;
  const activeType = input.type && input.type !== "all" ? input.type : undefined;
  const activeGroupKey = input.groupKey && input.groupKey !== "all" ? input.groupKey : undefined;
  const onlyUnread = Boolean(input.onlyUnread);

  let filteredItems = allItems;
  if (activeType) {
    filteredItems = filteredItems.filter((item) => item.type === activeType);
  }
  if (activeGroupKey) {
    filteredItems = filteredItems.filter((item) => item.groupKey === activeGroupKey);
  }
  if (onlyUnread) {
    filteredItems = filteredItems.filter((item) => !item.receipt.read);
  }

  const start = (page - 1) * pageSize;
  const items = filteredItems.slice(start, start + pageSize);

  return {
    items,
    page,
    pageSize,
    total: filteredItems.length,
    hasMore: start + pageSize < filteredItems.length,
    grouping: "type",
    groups: createNotificationGroups(filteredItems),
    filters: createNotificationFilters(allItems, activeType, activeGroupKey, onlyUnread),
    onlyUnread,
    ...(items[0] ? { selectedNotificationId: items[0].id } : {}),
  };
}

export function listNotifications(
  userState: UserState,
  input: {
    page?: number | undefined;
    pageSize?: number | undefined;
    type?: string | undefined;
    groupKey?: string | undefined;
    onlyUnread?: boolean | undefined;
    threadId?: string | undefined;
  },
): NotificationListResponse {
  const notificationList = createNotificationList(userState, input);
  const threadList = listMessageThreads(userState, { page: 1, pageSize: 20 });
  const reservedThreads = threadList.items;
  const selectedThread =
    (input.threadId ? threadList.items.find((thread) => thread.threadId === input.threadId) : undefined) ??
    reservedThreads.find((thread) => thread.unreadCount > 0) ??
    reservedThreads[0];

  return {
    notificationList,
    messageThread: selectedThread
      ? { ...selectedThread, participantLabels: [...selectedThread.participantLabels], touchpoints: cloneTouchpoints(selectedThread.touchpoints, userState) }
      : undefined,
    unreadBadge: createUnreadBadge(userState),
    reservedThreads,
    threadList,
  };
}

export function markNotificationsRead(
  userState: UserState,
  input: {
    notificationIds: string[];
    page?: number | undefined;
    pageSize?: number | undefined;
    type?: string | undefined;
    groupKey?: string | undefined;
    onlyUnread?: boolean | undefined;
  },
): MarkNotificationsReadResponse {
  const updatedIds = input.notificationIds.filter((notificationId) =>
    NOTIFICATION_SEEDS.some((seed) => seed.id === notificationId),
  );
  const timestamp = new Date().toISOString();

  for (const notificationId of updatedIds) {
    userState.notificationReadAtById[notificationId] = timestamp;
  }

  return {
    updatedIds,
    notificationList: createNotificationList(userState, input),
    unreadBadge: createUnreadBadge(userState),
  };
}

export function getUnreadBadge(userState: UserState): UnreadBadge {
  return createUnreadBadge(userState);
}

export function listMessageThreadResponse(
  userState: UserState,
  input: {
    page?: number;
    pageSize?: number;
    type?: MessageThread["type"] | "all";
    onlyUnread?: boolean;
    sort?: MessageThreadListSort;
    sourceTicketId?: string;
  } = {},
): MessageThreadListResponse {
  return {
    threadList: listMessageThreads(userState, input),
    unreadBadge: createUnreadBadge(userState),
  };
}

export function getMessageThread(
  userState: UserState,
  input: string | GetMessageThreadRequest,
): MessageThreadResponse | null {
  const request = typeof input === "string" ? { threadId: input } : input;
  const messageThread = deriveThreadState(userState, request.threadId);
  if (!messageThread) {
    return null;
  }
  const messageItems = getThreadMessages(userState, request.threadId);
  const detailActions = createMessageThreadActions(messageThread, messageItems);
  const changed = request.cursor ? request.cursor !== messageThread.syncState?.cursor : true;

  return {
    messageThread,
    messageItems,
    detailActions,
    unreadBadge: createUnreadBadge(userState),
    threadList: listMessageThreads(userState, { page: 1, pageSize: 20 }),
    changed,
  };
}

export function markThreadRead(userState: UserState, input: MarkThreadReadRequest): MessageThreadResponse | null {
  const existing = getMessageThread(userState, input.threadId);
  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  userState.threadReadAtById[input.threadId] = now;
  const record = getStoredThreadRecord(userState, input.threadId);
  if (record) {
    record.updatedAt = now;
  }
  return getMessageThread(userState, input.threadId);
}

export function createMessageThread(
  userState: UserState,
  input: CreateMessageThreadRequest,
  now = new Date().toISOString(),
): CreateMessageThreadResponse {
  ensureMessageRuntimeState(userState);
  const threadId = `thread_${crypto.randomUUID()}`;
  const title =
    input.title ??
    (input.type === "consultation"
      ? "New Consultation"
      : input.type === "customer_service"
        ? "Support Ticket"
        : input.type === "group"
          ? "New Group"
          : "New Conversation");
  const members: MessageThreadMember[] = [
    { userId: "self", label: "You", role: "customer", active: true, canReply: true, joinedAt: now },
    ...(input.participantUserIds ?? []).map((participantUserId) => ({
      userId: participantUserId,
      label: participantUserId,
      role: input.type === "private" ? ("member" as MessageThreadMemberRole) : ("viewer" as MessageThreadMemberRole),
      active: true,
      canReply: input.type !== "group",
      joinedAt: now,
    })),
  ];
  const syncState = createThreadSyncState(`${now}:0:0`, now);
  const thread: MessageThread = {
    threadId,
    type: input.type,
    title,
    subtitle:
      input.type === "consultation"
        ? "Created consultation thread"
        : input.type === "customer_service"
          ? "Created customer-service thread"
          : input.type === "group"
            ? "Created group thread"
            : "Created private thread",
    participantLabels: members.map((member) => member.label),
    pinned: false,
    doNotDisturb: false,
    unreadCount: 0,
    reserved: false,
    touchpoints: DEFAULT_MESSAGE_TOUCHPOINTS,
    replyPolicy: input.replyPolicy ?? (input.type === "group" ? "members_only" : "open"),
    members,
    ...(input.type === "consultation"
      ? {
          consultationProgress: {
            caseId: `consult_${crypto.randomUUID()}`,
            state: "queued" as MessageConsultationProgress["state"],
            nextStepLabel: "An advisor will be assigned after the first message.",
          },
        }
      : {}),
    ...(input.type === "customer_service"
      ? {
          supportProgress: {
            state: "unassigned" as MessageSupportProgress["state"],
            ...(input.sourceTicketId ? { ticketId: input.sourceTicketId } : {}),
            queueLabel: "General Support",
            nextStepLabel: "Support will assign this conversation after the first message.",
          },
        }
      : {}),
    ...(input.type === "group"
      ? {
          groupState: {
            memberCount: members.length,
            userMember: true,
            userRole: "customer",
            replyPolicy: input.replyPolicy ?? "members_only",
          },
        }
      : {}),
    syncState,
  };
  userState.threadRecordsById[threadId] = {
    thread: cloneMessageThread(thread, userState),
    messages: [],
    syncCursor: syncState.cursor,
    updatedAt: now,
  };
  userState.threadMessagesByThreadId[threadId] = [];
  return {
    messageThread: thread,
    detailActions: createMessageThreadActions(thread, []),
    unreadBadge: createUnreadBadge(userState),
    threadList: listMessageThreads(userState, { page: 1, pageSize: 20 }),
  };
}

export function sendThreadMessage(userState: UserState, input: SendMessageRequest): SendMessageResponse | null {
  const thread = deriveThreadState(userState, input.threadId);
  if (!thread) {
    return null;
  }
  if (!createMessageThreadActions(thread).canReply) {
    return null;
  }

  const sentAt = new Date().toISOString();
  const messageId = `msg_${crypto.randomUUID()}`;
  const dispatchTouchpoints = cloneTouchpoints(
    thread.touchpoints.map((touchpoint) => {
      const { receipt: _receipt, delivered: _delivered, statusLabel: _statusLabel, ...dispatchSeed } = touchpoint;
      return dispatchSeed;
    }),
    userState,
    {
    resourceId: `message:${messageId}`,
    resourceLabel: `message.${thread.type}`,
    createdAt: sentAt,
    body: input.body,
    },
  ).map((touchpoint) => {
    if (!touchpoint.receipt || touchpoint.channel === "in_app" || touchpoint.receipt.status !== "delivered") {
      return touchpoint;
    }
    const sentReceipt: MessageTouchpointReceipt = {
      receiptId: touchpoint.receipt.receiptId,
      status: "sent",
      retryCount: touchpoint.receipt.retryCount,
      retryable: touchpoint.receipt.retryable,
      ...(touchpoint.receipt.attemptedAt ? { attemptedAt: touchpoint.receipt.attemptedAt } : {}),
      ...(touchpoint.receipt.nextRetryAt ? { nextRetryAt: touchpoint.receipt.nextRetryAt } : {}),
      ...(touchpoint.receipt.providerReference ? { providerReference: touchpoint.receipt.providerReference } : {}),
    };
    return {
      ...touchpoint,
      delivered: false,
      statusLabel: `${touchpoint.providerLabel ?? touchpoint.providerKey ?? touchpoint.channel} accepted the dispatch and is awaiting receipt.`,
      receipt: sentReceipt,
    };
  });
  const failed = dispatchTouchpoints.some((touchpoint) => touchpoint.receipt?.status === "failed");
  const persistedTouchpoints: MessageTouchpoint[] = dispatchTouchpoints.map((touchpoint) => {
    if (touchpoint.channel === "in_app" || !touchpoint.receipt) {
      return touchpoint;
    }
    const receipt = touchpoint.receipt;
    const persistedReceipt: MessageTouchpointReceipt = {
      receiptId: receipt.receiptId,
      status: receipt.status,
      retryCount: receipt.retryCount,
      retryable: receipt.retryable,
      ...(receipt.attemptedAt ? { attemptedAt: receipt.attemptedAt } : {}),
      ...(receipt.deliveredAt ? { deliveredAt: receipt.deliveredAt } : {}),
      ...(receipt.failedAt ? { failedAt: receipt.failedAt } : {}),
      ...(receipt.failureCode ? { failureCode: receipt.failureCode } : {}),
      ...(receipt.failureMessage ? { failureMessage: receipt.failureMessage } : {}),
      ...(receipt.nextRetryAt ? { nextRetryAt: receipt.nextRetryAt } : {}),
      ...(receipt.providerReference ? { providerReference: `${receipt.providerReference}_${messageId}` } : {}),
    };
    return {
      ...touchpoint,
      receipt: persistedReceipt,
    };
  });

  const messageItem: MessageBodyItem = {
    messageId,
    threadId: input.threadId,
    direction: "outbound",
    senderRole: "self",
    senderLabel: "You",
    body: input.body,
    createdAt: sentAt,
    deliveryStatus: failed ? "failed" : "pending",
    attemptCount: 1,
    retryable: failed,
    ...(failed ? { failureCode: "DELIVERY_FAILED", failureMessage: "Sample delivery intentionally failed and can be retried." } : {}),
    touchpoints: persistedTouchpoints,
  };
  const record = getStoredThreadRecord(userState, input.threadId);
  if (!record) {
    return null;
  }
  const existingMessages = cloneMessageItems(record.messages, userState);
  const nextMessages = [...existingMessages];
  nextMessages.push(messageItem);
  record.messages = nextMessages;
  userState.threadMessagesByThreadId[input.threadId] = nextMessages;
  record.updatedAt = sentAt;
  if (thread.type === "consultation") {
    record.thread.consultationProgress = {
      caseId: record.thread.consultationProgress?.caseId ?? `consult_${crypto.randomUUID()}`,
      state: "in_progress",
      advisorLabel: record.thread.assignment?.assigneeLabel ?? "Advisor Nia",
      nextStepLabel: failed ? "Retry the failed consultation message." : "Wait for the advisor reply or add more detail.",
    };
  }
  if (thread.type === "customer_service") {
    record.thread.assignment = record.thread.assignment ?? {
      assigneeUserId: "support_agent_1",
      assigneeLabel: "Support Bot",
      teamLabel: "General Support",
      assignedAt: sentAt,
      statusLabel: "Assigned after first outbound support message",
    };
    record.thread.supportProgress = {
      state: failed ? "waiting_user" : "assigned",
      ...(record.thread.supportProgress?.ticketId ? { ticketId: record.thread.supportProgress.ticketId } : {}),
      queueLabel: record.thread.assignment.teamLabel ?? "General Support",
      assigneeLabel: record.thread.assignment.assigneeLabel ?? "Support Bot",
      nextStepLabel: failed ? "Retry this support reply." : "Support will continue in the same thread.",
    };
  }
  const messageThread = deriveThreadState(userState, input.threadId);
  if (!messageThread) {
    return null;
  }

  return {
    messageThread,
    messageItem,
    detailActions: createMessageThreadActions(messageThread, getThreadMessages(userState, input.threadId)),
    unreadBadge: createUnreadBadge(userState),
    threadList: listMessageThreads(userState, { page: 1, pageSize: 20 }),
  };
}

export function retryThreadMessage(userState: UserState, input: RetryMessageRequest): RetryMessageResponse | null {
  const record = getStoredThreadRecord(userState, input.threadId);
  if (!record) {
    return null;
  }
  const target = record.messages.find((message) => message.messageId === input.messageId);
  if (!target || target.deliveryStatus !== "failed" || !target.retryable) {
    return null;
  }
  const retriedAt = new Date().toISOString();
  target.deliveryStatus = "pending";
  target.retryable = false;
  target.attemptCount += 1;
  target.updatedAt = retriedAt;
  delete target.failureCode;
  delete target.failureMessage;
  target.touchpoints = target.touchpoints.map((touchpoint) => {
    if (!touchpoint.receipt || touchpoint.channel === "in_app" || touchpoint.receipt.status !== "failed") {
      return touchpoint;
    }
    return {
      ...touchpoint,
      delivered: false,
      statusLabel: `${touchpoint.providerLabel ?? touchpoint.providerKey ?? touchpoint.channel} retry queued.`,
      receipt: {
        ...touchpoint.receipt,
        status: "sent" as MessageTouchpointReceiptStatus,
        attemptedAt: retriedAt,
        retryCount: touchpoint.receipt.retryCount + 1,
        retryable: false,
        ...(touchpoint.receipt.providerReference ? { providerReference: touchpoint.receipt.providerReference } : {}),
      },
    };
  });
  record.updatedAt = retriedAt;
  userState.threadMessagesByThreadId[input.threadId] = cloneMessageItems(record.messages, userState);
  const messageThread = deriveThreadState(userState, input.threadId);
  if (!messageThread) {
    return null;
  }
  const messageItem = cloneMessageBodyItem(target, userState);
  return {
    messageThread,
    messageItem,
    detailActions: createMessageThreadActions(messageThread, getThreadMessages(userState, input.threadId)),
    unreadBadge: createUnreadBadge(userState),
    threadList: listMessageThreads(userState, { page: 1, pageSize: 20 }),
  };
}

export function syncMessageThread(userState: UserState, input: SyncMessageThreadRequest): MessageThreadResponse | null {
  return getMessageThread(userState, {
    threadId: input.threadId,
    ...(input.cursor !== undefined ? { cursor: input.cursor } : {}),
  });
}

const FEEDBACK_FAQ_ENTRIES: Record<string, FeedbackFaqEntry> = {
  account: {
    entryId: "faq_account_recovery",
    title: "Account Recovery FAQ",
    summary: "Use the shared account recovery lane before opening a duplicate support ticket.",
    linkLabel: "Open FAQ",
    linkUrl: "https://example.test/faq/account-recovery",
  },
  payment: {
    entryId: "faq_payment_status",
    title: "Payment Status FAQ",
    summary: "Check order and payment status before escalating duplicate billing questions.",
    linkLabel: "Open FAQ",
    linkUrl: "https://example.test/faq/payment-status",
  },
  content: {
    entryId: "faq_content_review",
    title: "Content Review FAQ",
    summary: "Review content moderation expectations and publication timing.",
    linkLabel: "Open FAQ",
    linkUrl: "https://example.test/faq/content-review",
  },
};

function createFeedbackSupportEntry(
  label: string,
  summary: string,
  queueKey: string,
  queueLabel: string,
): FeedbackSupportEntry {
  return {
    entryId: `support_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    label,
    summary,
    channel: "messages",
    queueKey,
    queueLabel,
    handlerLabel: queueLabel,
    routeId: APP_ROUTE_IDS.messages,
    threadId: "thread_customer_service",
    updatedAt: "2026-04-07T18:10:00.000Z",
    enabled: true,
  };
}

function createFeedbackFaqEntries(keys: Array<keyof typeof FEEDBACK_FAQ_ENTRIES>): FeedbackFaqEntry[] {
  return keys.map((key) => ({ ...FEEDBACK_FAQ_ENTRIES[key]! }));
}

const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  {
    key: "product_issue",
    label: "Product Issue",
    type: "issue_report",
    description: "Use for broken flows, rendering issues, or session recovery problems.",
    defaultPriority: "high",
    labels: ["product", "bug"],
    supportsAttachments: true,
    faqEntry: FEEDBACK_FAQ_ENTRIES.account!,
    faqEntries: createFeedbackFaqEntries(["account"]),
    customerServiceEntryLabel: "Open Support Desk",
    supportEntry: createFeedbackSupportEntry(
      "Open Support Desk",
      "Route this ticket into the shared customer-service inbox thread for follow-up.",
      "product_support",
      "Product Support",
    ),
    defaultQueueKey: "product_support",
    defaultQueueLabel: "Product Support",
  },
  {
    key: "improvement",
    label: "Suggestion",
    type: "suggestion",
    description: "Use for ideas, workflow improvements, and missing capabilities.",
    defaultPriority: "medium",
    labels: ["product", "idea"],
    supportsAttachments: true,
    customerServiceEntryLabel: "Open Suggestion Review Queue",
    supportEntry: createFeedbackSupportEntry(
      "Open Suggestion Review Queue",
      "Use the shared inbox thread to clarify product suggestions and expected improvements.",
      "suggestion_review",
      "Suggestion Review",
    ),
    defaultQueueKey: "suggestion_review",
    defaultQueueLabel: "Suggestion Review",
  },
  {
    key: "billing",
    label: "Payment Issue",
    type: "complaint",
    description: "Use for billing confusion, refunds, or duplicate payment concerns.",
    defaultPriority: "urgent",
    labels: ["payment", "billing"],
    supportsAttachments: true,
    faqEntry: FEEDBACK_FAQ_ENTRIES.payment!,
    faqEntries: createFeedbackFaqEntries(["payment"]),
    customerServiceEntryLabel: "Open Billing Support",
    supportEntry: createFeedbackSupportEntry(
      "Open Billing Support",
      "Continue billing follow-up in the shared customer-service thread with order context.",
      "billing_support",
      "Billing Support",
    ),
    defaultQueueKey: "billing_support",
    defaultQueueLabel: "Billing Support",
  },
  {
    key: "abuse",
    label: "Report Abuse",
    type: "abuse_report",
    description: "Use for harmful content, impersonation, or abuse reporting.",
    defaultPriority: "urgent",
    labels: ["abuse", "moderation"],
    supportsAttachments: true,
    faqEntry: FEEDBACK_FAQ_ENTRIES.content!,
    faqEntries: createFeedbackFaqEntries(["content"]),
    customerServiceEntryLabel: "Open Trust and Safety Desk",
    supportEntry: createFeedbackSupportEntry(
      "Open Trust and Safety Desk",
      "Escalate moderation follow-up into the reserved support thread used by the sample inbox.",
      "trust_safety",
      "Trust And Safety",
    ),
    defaultQueueKey: "trust_safety",
    defaultQueueLabel: "Trust And Safety",
  },
  {
    key: "satisfaction",
    label: "Satisfaction Survey",
    type: "satisfaction",
    description: "Use for structured service satisfaction feedback.",
    defaultPriority: "low",
    labels: ["survey", "quality"],
    supportsAttachments: false,
    customerServiceEntryLabel: "Open Service Quality Desk",
    supportEntry: createFeedbackSupportEntry(
      "Open Service Quality Desk",
      "Continue service-quality follow-up in the shared support inbox thread.",
      "service_quality",
      "Service Quality",
    ),
    defaultQueueKey: "service_quality",
    defaultQueueLabel: "Service Quality",
  },
];

function createDefaultFeedbackFaqCatalog(): FeedbackFaqEntry[] {
  return Object.values(FEEDBACK_FAQ_ENTRIES).map((entry) => ({
    ...entry,
    enabled: true,
    updatedAt: "2026-04-07T18:10:00.000Z",
    categoryKeys:
      entry.entryId === "faq_account_recovery"
        ? ["product_issue"]
        : entry.entryId === "faq_payment_status"
          ? ["billing"]
          : ["abuse"],
  }));
}

function createDefaultFeedbackSupportEntries(): FeedbackSupportEntry[] {
  return FEEDBACK_CATEGORIES.map((category) => ({
    ...(category.supportEntry ? structuredClone(category.supportEntry) : createFeedbackSupportEntry("Support", "Support", "general", "General Support")),
    ...(category.defaultQueueKey ? { queueKey: category.defaultQueueKey } : {}),
    ...(category.defaultQueueLabel ? { queueLabel: category.defaultQueueLabel } : {}),
  }));
}

function ensureFeedbackRuntimeState(userState: UserState) {
  userState.feedbackTicketIds ??= [];
  if ((userState.feedbackFaqCatalog?.length ?? 0) === 0) {
    userState.feedbackFaqCatalog = createDefaultFeedbackFaqCatalog();
  }
  if ((userState.feedbackSupportEntries?.length ?? 0) === 0) {
    userState.feedbackSupportEntries = createDefaultFeedbackSupportEntries();
  }
}

function cloneFeedbackCategory(category: FeedbackCategory): FeedbackCategory {
  return {
    ...category,
    labels: [...category.labels],
    ...(category.faqEntry ? { faqEntry: { ...category.faqEntry } } : {}),
    ...(category.faqEntries ? { faqEntries: category.faqEntries.map((entry) => ({ ...entry })) } : {}),
    ...(category.supportEntry ? { supportEntry: { ...category.supportEntry } } : {}),
  };
}

function cloneFeedbackStatus(status: FeedbackStatus): FeedbackStatus {
  return {
    ...status,
    handlingProgress: [...status.handlingProgress],
    processingHistory: status.processingHistory.map((record) => ({ ...record })),
    ...(status.assignee ? { assignee: { ...status.assignee } } : {}),
    ...(status.sla ? { sla: { ...status.sla } } : {}),
    ...(status.faqEntry ? { faqEntry: { ...status.faqEntry } } : {}),
    ...(status.faqEntries ? { faqEntries: status.faqEntries.map((entry) => ({ ...entry })) } : {}),
    ...(status.supportEntry ? { supportEntry: { ...status.supportEntry } } : {}),
    ...(status.revisitAction ? { revisitAction: { ...status.revisitAction } } : {}),
  };
}

function resolveFeedbackCategory(categoryKey: string, type: FeedbackType): FeedbackCategory {
  const fallbackCategory = FEEDBACK_CATEGORIES[0];
  return (
    FEEDBACK_CATEGORIES.find((category) => category.key === categoryKey) ??
    FEEDBACK_CATEGORIES.find((category) => category.type === type) ??
    fallbackCategory!
  );
}

function shiftIsoMinutes(timestamp: string, minutes: number): string {
  return new Date(new Date(timestamp).getTime() + minutes * 60_000).toISOString();
}

function createFeedbackRevisitAction(
  ticketId: string,
  category: FeedbackCategory,
  state: FeedbackStatus["state"],
  revisitRequired: boolean,
): FeedbackRevisitAction {
  return {
    ticketId,
    label:
      state === "waiting_user"
        ? "Reply With Requested Details"
        : state === "resolved" || state === "closed"
          ? "Request Follow-up"
          : "Add More Context",
    summary:
      revisitRequired
        ? "The support lane is waiting for more context before closing the ticket."
        : `Continue follow-up for ${category.label.toLowerCase()} in the shared support lane.`,
    enabled: true,
    ...(category.supportEntry?.routeId ? { routeId: category.supportEntry.routeId } : {}),
    ...(category.supportEntry?.threadId ? { threadId: category.supportEntry.threadId } : {}),
    suggestedReply:
      state === "waiting_user"
        ? "I am following up with the details you requested."
        : `Following up on ${ticketId}: please review the latest update.`,
  };
}

function createFeedbackStatus(
  ticketId: string,
  state: FeedbackStatus["state"],
  category: FeedbackCategory,
  revisitRequired: boolean,
  createdAt: string,
  options: {
    queueKey?: string;
    queueLabel?: string;
    assignee?: FeedbackTicketAssignee;
    sla?: FeedbackTicketSla;
    supportEntry?: FeedbackSupportEntry;
  } = {},
): FeedbackStatus {
  const history: FeedbackStatus["processingHistory"] = [
    {
      recordedAt: createdAt,
      actorLabel: "System Intake",
      actorRole: "system",
      actionLabel: "Ticket created",
      note: "Feedback entered the shared support loop foundation.",
      state: "submitted" as const,
    },
  ];

  if (state === "triaged" || state === "in_progress" || state === "waiting_user" || state === "resolved" || state === "closed") {
    history.push({
      recordedAt: shiftIsoMinutes(createdAt, 10),
      actorLabel: "Support Queue",
      actorRole: "support",
      actionLabel: "Ticket triaged",
      note: "The shared support lane assigned the ticket to the right queue.",
      state: "triaged",
    });
  }

  if (state === "in_progress" || state === "waiting_user" || state === "resolved" || state === "closed") {
    history.push({
      recordedAt: shiftIsoMinutes(createdAt, 25),
      actorLabel: "Support Specialist",
      actorRole: "support",
      actionLabel: "Support review started",
      note: "A support agent started reviewing the provided context and attachments.",
      state: "in_progress",
    });
  }

  if (state === "waiting_user") {
    history.push({
      recordedAt: shiftIsoMinutes(createdAt, 35),
      actorLabel: "Support Specialist",
      actorRole: "support",
      actionLabel: "Additional context requested",
      note: "The support lane asked for more detail before closing the loop.",
      state: "waiting_user",
    });
  }

  if (state === "resolved" || state === "closed") {
    history.push({
      recordedAt: shiftIsoMinutes(createdAt, 45),
      actorLabel: "Support Specialist",
      actorRole: "support",
      actionLabel: "Resolution posted",
      note: "A sample resolution was attached to the support loop for follow-up confirmation.",
      state: "resolved",
    });
  }

  if (state === "closed") {
    history.push({
      recordedAt: shiftIsoMinutes(createdAt, 60),
      actorLabel: "System Intake",
      actorRole: "system",
      actionLabel: "Ticket closed",
      note: "The feedback service loop completed without additional follow-up.",
      state: "closed",
    });
  }

  return {
    state,
    label:
      state === "submitted"
        ? "Submitted"
        : state === "triaged"
          ? "Triaged"
          : state === "in_progress"
            ? "In Progress"
            : state === "waiting_user"
              ? "Waiting for User"
              : state === "resolved"
                ? "Resolved"
                : "Closed",
    progressLabel:
      state === "submitted"
        ? "Queued for initial review"
        : state === "triaged"
          ? "Assigned to the right support lane"
          : state === "in_progress"
            ? "Being processed by support"
            : state === "waiting_user"
              ? "Waiting for more user context"
              : state === "resolved"
                ? "Handled and ready for confirmation"
                : "Service loop complete",
    nextStepLabel:
      state === "waiting_user"
        ? "Reply from the support entry to continue this ticket."
        : state === "resolved"
          ? "Confirm whether the proposed resolution is sufficient."
          : state === "closed"
            ? "Open a follow-up if the issue returns."
            : "Use the support entry if you need to add more context.",
    revisitRequired,
    ...(category.faqEntry ? { faqEntry: { ...category.faqEntry } } : {}),
    ...(category.faqEntries ? { faqEntries: category.faqEntries.map((entry) => ({ ...entry })) } : {}),
    ...(category.customerServiceEntryLabel
      ? { customerServiceEntryLabel: category.customerServiceEntryLabel }
      : {}),
    ...(options.supportEntry ? { supportEntry: { ...options.supportEntry } } : category.supportEntry ? { supportEntry: { ...category.supportEntry } } : {}),
    ...(options.queueKey ? { queueKey: options.queueKey } : category.defaultQueueKey ? { queueKey: category.defaultQueueKey } : {}),
    ...(options.queueLabel ? { queueLabel: options.queueLabel } : category.defaultQueueLabel ? { queueLabel: category.defaultQueueLabel } : {}),
    ...(options.assignee ? { assignee: { ...options.assignee } } : {}),
    ...(options.sla ? { sla: { ...options.sla } } : {}),
    revisitAction: createFeedbackRevisitAction(ticketId, category, state, revisitRequired),
    handlingProgress: [
      "Submitted to intake",
      "Routed to support lane",
      "Support review in progress",
      revisitRequired ? "Waiting for your reply" : "Waiting for support confirmation",
      "Resolved or closed",
    ],
    processingHistory: history,
  };
}

function createFeedbackTicketResponse(
  ticket: FeedbackTicket,
  category: FeedbackCategory,
  status: FeedbackStatus,
): FeedbackTicketDetailResponse {
  return {
    feedbackTicket: structuredClone(ticket),
    feedbackCategory: cloneFeedbackCategory(category),
    feedbackStatus: cloneFeedbackStatus(status),
  };
}

function cloneFeedbackTicket(ticket: FeedbackTicket): FeedbackTicket {
  return {
    ...ticket,
    labels: [...ticket.labels],
    ...(ticket.assignee ? { assignee: { ...ticket.assignee } } : {}),
    ...(ticket.sla ? { sla: { ...ticket.sla } } : {}),
    context: {
      ...ticket.context,
      screenshotAssets: ticket.context.screenshotAssets.map((asset) => structuredClone(asset)),
      attachmentAssets: ticket.context.attachmentAssets.map((asset) => structuredClone(asset)),
    },
  };
}

function createFeedbackTicketSummary(detail: FeedbackTicketDetailResponse): FeedbackTicketSummary {
  return {
    ticketId: detail.feedbackTicket.ticketId,
    title: detail.feedbackTicket.title,
    categoryKey: detail.feedbackTicket.categoryKey,
    categoryLabel: detail.feedbackCategory.label,
    type: detail.feedbackTicket.type,
    state: detail.feedbackStatus.state,
    priority: detail.feedbackTicket.priority,
    labels: [...detail.feedbackTicket.labels],
    revisitRequired: detail.feedbackStatus.revisitRequired,
    ...(detail.feedbackStatus.queueKey ? { queueKey: detail.feedbackStatus.queueKey } : {}),
    ...(detail.feedbackStatus.queueLabel ? { queueLabel: detail.feedbackStatus.queueLabel } : {}),
    ...(detail.feedbackStatus.assignee ? { assignee: { ...detail.feedbackStatus.assignee } } : {}),
    ...(detail.feedbackStatus.sla ? { sla: { ...detail.feedbackStatus.sla } } : {}),
    ...(detail.feedbackTicket.supportThreadId ? { supportThreadId: detail.feedbackTicket.supportThreadId } : {}),
    lastUpdatedAt: detail.feedbackTicket.updatedAt,
  };
}

function createFeedbackTicketList(
  userState: UserState,
  input: ListFeedbackTicketsRequest = {},
): FeedbackTicketList {
  ensureFeedbackRuntimeState(userState);
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 10;
  const keyword = input.keyword?.trim().toLowerCase();
  const filteredIds = userState.feedbackTicketIds.filter((ticketId) => {
    const detail = userState.feedbackDetailsById[ticketId];
    if (!detail) {
      return false;
    }
    if (input.state && input.state !== "all" && detail.feedbackStatus.state !== input.state) {
      return false;
    }
    if (input.categoryKey && detail.feedbackTicket.categoryKey !== input.categoryKey) {
      return false;
    }
    if (keyword) {
      const haystack = `${detail.feedbackTicket.title} ${detail.feedbackTicket.description} ${detail.feedbackTicket.labels.join(" ")}`.toLowerCase();
      if (!haystack.includes(keyword)) {
        return false;
      }
    }
    return true;
  });
  const total = filteredIds.length;
  const start = Math.max(0, (page - 1) * pageSize);
  const items = filteredIds.slice(start, start + pageSize).map((ticketId) => createFeedbackTicketSummary(userState.feedbackDetailsById[ticketId]!));

  return {
    items,
    page,
    pageSize,
    total,
    hasMore: start + items.length < total,
    ...(userState.latestFeedbackTicketId ? { selectedTicketId: userState.latestFeedbackTicketId } : {}),
  };
}

function cloneFeedbackFaqCatalog(entries: FeedbackFaqEntry[]): FeedbackFaqEntry[] {
  return entries.map((entry) => ({
    ...entry,
    ...(entry.categoryKeys ? { categoryKeys: [...entry.categoryKeys] } : {}),
  }));
}

function cloneFeedbackSupportEntries(entries: FeedbackSupportEntry[]): FeedbackSupportEntry[] {
  return entries.map((entry) => ({ ...entry }));
}

function appendSupportMessageToThread(
  userState: UserState,
  input: {
    threadId: string;
    senderLabel: string;
    body: string;
    createdAt: string;
  },
): MessageThread | null {
  const record = getStoredThreadRecord(userState, input.threadId);
  if (!record) {
    return null;
  }

  const nextMessage: MessageBodyItem = {
    messageId: `msg_${crypto.randomUUID()}`,
    threadId: input.threadId,
    direction: "inbound",
    senderRole: "support",
    senderLabel: input.senderLabel,
    body: input.body,
    createdAt: input.createdAt,
    deliveryStatus: "delivered",
    deliveredAt: input.createdAt,
    attemptCount: 1,
    retryable: false,
    touchpoints: cloneTouchpoints(record.thread.touchpoints, userState),
  };
  record.messages = [...cloneMessageItems(record.messages, userState), nextMessage];
  userState.threadMessagesByThreadId[input.threadId] = cloneMessageItems(record.messages, userState);
  record.updatedAt = input.createdAt;
  return deriveThreadState(userState, input.threadId) ?? null;
}

function ensureFeedbackSupportThread(
  userState: UserState,
  ticketId: string,
  category: FeedbackCategory,
  description: string,
  now: string,
): FeedbackSupportEntry | undefined {
  const seedSupportEntry = category.supportEntry;
  if (!seedSupportEntry) {
    return undefined;
  }

  const threadResponse = createMessageThread(userState, {
    type: "customer_service",
    title: `${category.label}: ${ticketId}`,
    sourceTicketId: ticketId,
  }, now);
  sendThreadMessage(userState, {
    threadId: threadResponse.messageThread.threadId,
    body: `[${ticketId}] ${description}`,
  });
  return {
    ...seedSupportEntry,
    ...(category.defaultQueueKey ? { queueKey: category.defaultQueueKey } : {}),
    ...(category.defaultQueueLabel ? { queueLabel: category.defaultQueueLabel } : {}),
    threadId: threadResponse.messageThread.threadId,
    updatedAt: now,
    enabled: true,
  };
}

function createDefaultFeedbackContext(
  session: SessionRecord,
  request: SubmitFeedbackRequest["context"],
): FeedbackTicket["context"] {
  return {
    sourcePage: request.sourcePage,
    ...(request.sourceRouteId ? { sourceRouteId: request.sourceRouteId } : {}),
    ...(request.sourceLabel ? { sourceLabel: request.sourceLabel } : {}),
    userId: request.userId ?? session.userId,
    platform: request.platform,
    appVersion: request.appVersion,
    ...(request.deviceSummary ? { deviceSummary: request.deviceSummary } : {}),
    screenshotAssets: request.screenshotAssets.map((asset) => structuredClone(asset)),
    attachmentAssets: request.attachmentAssets.map((asset) => structuredClone(asset)),
  };
}

export function createFeedbackBootstrapResponse(userState: UserState): FeedbackBootstrapResponse {
  ensureFeedbackRuntimeState(userState);
  const latestDetail = userState.latestFeedbackTicketId
    ? userState.feedbackDetailsById[userState.latestFeedbackTicketId]
    : undefined;
  const referenceCategory = latestDetail?.feedbackCategory ?? FEEDBACK_CATEGORIES[0];
  const serviceLoopSummary =
    latestDetail?.feedbackStatus.nextStepLabel ?? latestDetail?.feedbackStatus.progressLabel ?? referenceCategory?.description;

  return {
    feedbackCategories: FEEDBACK_CATEGORIES.map(cloneFeedbackCategory),
    ticketList: createFeedbackTicketList(userState, { page: 1, pageSize: 10 }),
    recommendedFaqEntries:
      referenceCategory?.faqEntries?.map((entry) => ({ ...entry })) ??
      (referenceCategory?.faqEntry ? [{ ...referenceCategory.faqEntry }] : []),
    faqCatalog: cloneFeedbackFaqCatalog(userState.feedbackFaqCatalog),
    supportEntries: cloneFeedbackSupportEntries(userState.feedbackSupportEntries),
    ...(latestDetail?.feedbackStatus.supportEntry
      ? { supportEntry: { ...latestDetail.feedbackStatus.supportEntry } }
      : referenceCategory?.supportEntry
        ? { supportEntry: { ...referenceCategory.supportEntry } }
        : {}),
    ...(serviceLoopSummary !== undefined ? { serviceLoopSummary } : {}),
    ...(latestDetail
      ? {
          latestTicket: structuredClone(latestDetail.feedbackTicket),
          latestStatus: cloneFeedbackStatus(latestDetail.feedbackStatus),
          latestCategory: cloneFeedbackCategory(latestDetail.feedbackCategory),
        }
      : {}),
  };
}

export function submitFeedbackTicket(
  session: SessionRecord,
  userState: UserState,
  request: SubmitFeedbackRequest,
  now = new Date().toISOString(),
): SubmitFeedbackResponse {
  ensureFeedbackRuntimeState(userState);
  const category = resolveFeedbackCategory(request.categoryKey, request.type);
  const ticketId = `fb_${crypto.randomUUID()}`;
  const priority: FeedbackPriority = request.priority ?? category.defaultPriority;
  const revisitRequested = Boolean(request.revisitRequested);
  const supportEntry = ensureFeedbackSupportThread(userState, ticketId, category, request.description, now);
  const assignee: FeedbackTicketAssignee | undefined =
    supportEntry?.handlerLabel
      ? {
          userId: "support_agent_1",
          label: "Support Bot",
          ...(supportEntry.queueLabel ?? category.defaultQueueLabel
            ? { teamLabel: supportEntry.queueLabel ?? category.defaultQueueLabel! }
            : {}),
          assignedAt: now,
        }
      : undefined;
  const sla: FeedbackTicketSla = {
    policyKey: `${category.key}_default_sla`,
    label: category.defaultPriority === "urgent" ? "2 hour response" : "24 hour response",
    deadlineAt: shiftIsoMinutes(now, category.defaultPriority === "urgent" ? 120 : 24 * 60),
    breached: false,
    updatedAt: now,
  };
  const ticket: FeedbackTicket = {
    ticketId,
    type: request.type,
    categoryKey: category.key,
    title: request.title,
    description: request.description,
    priority,
    labels: [...new Set([...(request.labels ?? []), ...category.labels])],
    revisitRequested,
    ...(request.satisfactionScore !== undefined ? { satisfactionScore: request.satisfactionScore } : {}),
    ...(category.defaultQueueKey ? { queueKey: category.defaultQueueKey } : {}),
    ...(category.defaultQueueLabel ? { queueLabel: category.defaultQueueLabel } : {}),
    ...(assignee ? { assignee } : {}),
    sla,
    ...(supportEntry?.threadId ? { supportThreadId: supportEntry.threadId } : {}),
    createdAt: now,
    updatedAt: now,
    context: createDefaultFeedbackContext(session, request.context),
  };
  const statusState: FeedbackStatus["state"] =
    category.type === "abuse_report" || category.defaultPriority === "urgent" ? "triaged" : "submitted";
  const status = createFeedbackStatus(ticketId, statusState, category, revisitRequested, now, {
    ...(ticket.queueKey ? { queueKey: ticket.queueKey } : {}),
    ...(ticket.queueLabel ? { queueLabel: ticket.queueLabel } : {}),
    ...(ticket.assignee ? { assignee: ticket.assignee } : {}),
    ...(ticket.sla ? { sla: ticket.sla } : {}),
    ...(supportEntry ? { supportEntry } : {}),
  });
  if (status.revisitAction && supportEntry?.threadId) {
    status.revisitAction.threadId = supportEntry.threadId;
  }
  const response = createFeedbackTicketResponse(ticket, category, status);

  bindUploadAssetsToOwner(userState, {
    assetIds: ticket.context.screenshotAssets.map((asset) => asset.assetId),
    ownerType: "feedback",
    ownerId: ticketId,
    role: "screenshot",
    now,
  });
  bindUploadAssetsToOwner(userState, {
    assetIds: ticket.context.attachmentAssets.map((asset) => asset.assetId),
    ownerType: "feedback",
    ownerId: ticketId,
    role: "attachment",
    now,
  });
  userState.feedbackDetailsById[ticketId] = response;
  userState.feedbackTicketIds = [ticketId, ...userState.feedbackTicketIds.filter((existing) => existing !== ticketId)];
  userState.latestFeedbackTicketId = ticketId;
  return response;
}

export function getFeedbackTicket(userState: UserState, ticketId: string): FeedbackTicketDetailResponse | null {
  ensureFeedbackRuntimeState(userState);
  const detail = userState.feedbackDetailsById[ticketId];
  return detail ? createFeedbackTicketResponse(detail.feedbackTicket, detail.feedbackCategory, detail.feedbackStatus) : null;
}

export function listFeedbackTickets(
  userState: UserState,
  input: ListFeedbackTicketsRequest = {},
): ListFeedbackTicketsResponse {
  ensureFeedbackRuntimeState(userState);
  return {
    ticketList: createFeedbackTicketList(userState, input),
    faqCatalog: cloneFeedbackFaqCatalog(userState.feedbackFaqCatalog),
    supportEntries: cloneFeedbackSupportEntries(userState.feedbackSupportEntries),
  };
}

export function revisitFeedbackTicket(
  userState: UserState,
  request: FeedbackRevisitRequest,
  now = new Date().toISOString(),
): FeedbackRevisitResponse | null {
  ensureFeedbackRuntimeState(userState);
  const existing = userState.feedbackDetailsById[request.ticketId];
  if (!existing) {
    return null;
  }

  const previousState = existing.feedbackStatus.state;
  const nextState: FeedbackStatus["state"] =
    previousState === "resolved" || previousState === "closed" ? "triaged" : "in_progress";
  const nextTicket: FeedbackTicket = {
    ...cloneFeedbackTicket(existing.feedbackTicket),
    updatedAt: now,
    revisitRequested: true,
  };
  const nextStatus = createFeedbackStatus(nextTicket.ticketId, nextState, existing.feedbackCategory, true, nextTicket.createdAt, {
    ...(nextTicket.queueKey ? { queueKey: nextTicket.queueKey } : {}),
    ...(nextTicket.queueLabel ? { queueLabel: nextTicket.queueLabel } : {}),
    ...(nextTicket.assignee ? { assignee: nextTicket.assignee } : {}),
    ...(nextTicket.sla ? { sla: nextTicket.sla } : {}),
    ...(existing.feedbackStatus.supportEntry ? { supportEntry: existing.feedbackStatus.supportEntry } : {}),
  });
  nextStatus.processingHistory.push({
    recordedAt: now,
    actorLabel: "User Follow-up",
    actorRole: "user",
    actionLabel: request.userMessage ? "Revisit requested with context" : "Revisit requested",
    ...(request.userMessage ? { note: request.userMessage } : { note: "The user reopened the support loop from feedback." }),
    state: nextState,
  });

  if (existing.feedbackStatus.supportEntry?.threadId && request.userMessage) {
    sendThreadMessage(userState, {
      threadId: existing.feedbackStatus.supportEntry.threadId,
      body: `[${nextTicket.ticketId}] ${request.userMessage}`,
    });
  }

  const response = createFeedbackTicketResponse(nextTicket, existing.feedbackCategory, nextStatus);
  userState.feedbackDetailsById[request.ticketId] = response;
  userState.latestFeedbackTicketId = request.ticketId;
  return response;
}

export function applyFeedbackTicketAction(
  userState: UserState,
  request: FeedbackTicketActionRequest,
  now = new Date().toISOString(),
): FeedbackTicketActionResponse | null {
  ensureFeedbackRuntimeState(userState);
  const existing = userState.feedbackDetailsById[request.ticketId];
  if (!existing) {
    return null;
  }

  const nextTicket: FeedbackTicket = {
    ...cloneFeedbackTicket(existing.feedbackTicket),
    updatedAt: now,
    ...(request.priority ? { priority: request.priority } : {}),
    ...(request.labels ? { labels: [...new Set(request.labels)] } : {}),
    ...(request.queueKey ? { queueKey: request.queueKey } : {}),
    ...(request.queueLabel ? { queueLabel: request.queueLabel } : {}),
    ...(request.assignee ? { assignee: { ...request.assignee } } : {}),
    ...(request.sla ? { sla: { ...request.sla, updatedAt: now } } : {}),
    ...(request.state === "closed" ? { closedAt: now } : {}),
  };
  const nextState = request.state ?? existing.feedbackStatus.state;
  const supportEntry: FeedbackSupportEntry | undefined =
    existing.feedbackStatus.supportEntry ?? existing.feedbackCategory.supportEntry;
  const nextStatus = createFeedbackStatus(nextTicket.ticketId, nextState, existing.feedbackCategory, nextTicket.revisitRequested, nextTicket.createdAt, {
    ...(nextTicket.queueKey ? { queueKey: nextTicket.queueKey } : {}),
    ...(nextTicket.queueLabel ? { queueLabel: nextTicket.queueLabel } : {}),
    ...(nextTicket.assignee ? { assignee: nextTicket.assignee } : {}),
    ...(nextTicket.sla ? { sla: nextTicket.sla } : {}),
    ...(supportEntry ? { supportEntry } : {}),
  });
  nextStatus.processingHistory.push(
    {
      recordedAt: now,
      actorLabel: request.assignee?.label ?? "Support Desk",
      actorRole: "support",
      ...(request.assignee?.userId ? { actorUserId: request.assignee.userId } : {}),
      actionLabel: request.state ? `Ticket moved to ${request.state.replaceAll("_", " ")}` : "Ticket updated",
      ...(request.note ? { note: request.note } : {}),
      state: nextState,
    },
    ...(request.assignee
      ? [{
          recordedAt: now,
          actorLabel: request.assignee.label,
          actorRole: "support" as const,
          actorUserId: request.assignee.userId,
          actionLabel: "Ticket assigned",
          note: request.assignee.teamLabel ? `Assigned to ${request.assignee.teamLabel}.` : "Assigned to support owner.",
          state: nextState,
        }]
      : []),
  );
  if (request.supportReply && nextTicket.supportThreadId) {
    appendSupportMessageToThread(userState, {
      threadId: nextTicket.supportThreadId,
      senderLabel: request.assignee?.label ?? nextStatus.assignee?.label ?? "Support Bot",
      body: request.supportReply,
      createdAt: now,
    });
  }
  if (nextStatus.revisitAction && nextTicket.supportThreadId) {
    nextStatus.revisitAction.threadId = nextTicket.supportThreadId;
  }

  const response = createFeedbackTicketResponse(nextTicket, existing.feedbackCategory, nextStatus);
  userState.feedbackDetailsById[request.ticketId] = response;
  userState.latestFeedbackTicketId = request.ticketId;

  return {
    ...response,
    ticketList: createFeedbackTicketList(userState, { page: 1, pageSize: 10 }),
  };
}
