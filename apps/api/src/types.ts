import type {
  AccountOperationCooldown,
  AccountOperationKind,
  AccountOperationRecord,
  AfterSalesCase,
  ContentActorRole,
  ContentAttachmentReference,
  ContentAuditEntry,
  ContentAuthoringData,
  UserAvailabilityStatus,
  AuthCredentialProtection,
  AuthDeviceIdentity,
  AuthIdentityWorkflow,
  AuthRateLimitState,
  AuthVerificationPurpose,
  AuthIdentity,
  AuthSecurityAuditEvent,
  AuthSecurityPrompt,
  AuthStatus,
  AuthRedirectTarget,
  ContentLifecycle,
  ContentModel,
  ContentReviewRecord,
  ContentVisibility,
  FeedbackFaqEntry,
  FeedbackSupportEntry,
  FeedbackTicketDetailResponse,
  LoginMethod,
  LoginPlatformKind,
  MessageBodyItem,
  MessageTouchpointChannel,
  MessageTouchpointReceipt,
  MessageThread,
  OrderDetailResponse,
  PurchaseMembershipRequest,
  ReadingProgress,
  SharePrepareResponse,
  SettingsNotificationChannel,
  SettingsPrivacyOptions,
  SettingsPreferences,
  SettingsFeatureToggles,
  UserAssetLedgerEntry,
  UserFriendState,
  UploadChunkReceipt,
  UploadCleanupRecord,
  UploadPipelineResponse,
  UploadReference,
  UploadReviewRecord,
  UploadSelectionResult,
  UploadSession,
  UploadTransferPayload,
} from "@minix/contracts";

export interface ApiBindings {
  MINIX_STORE?: ApiStore;
  MINIX_CORS_ALLOWED_ORIGINS?: string;
  MINIX_DEPLOY_ENV?: string;
  MINIX_AUTH_RATE_LIMIT_WINDOW_SECONDS?: string;
  MINIX_AUTH_LOGIN_MAX_ATTEMPTS?: string;
  MINIX_AUTH_REFRESH_MAX_ATTEMPTS?: string;
  MINIX_AUTH_SMS_PROVIDER_MODE?: string;
  MINIX_AUTH_OAUTH_PROVIDER_MODE?: string;
  MINIX_MESSAGE_TOUCHPOINT_PROVIDER_MODE?: string;
  MINIX_MESSAGE_SUBSCRIPTION_PROVIDER_KEY?: string;
  MINIX_MESSAGE_SUBSCRIPTION_PROVIDER_LABEL?: string;
  MINIX_MESSAGE_SMS_PROVIDER_KEY?: string;
  MINIX_MESSAGE_SMS_PROVIDER_LABEL?: string;
  MINIX_MESSAGE_EMAIL_PROVIDER_KEY?: string;
  MINIX_MESSAGE_EMAIL_PROVIDER_LABEL?: string;
  MINIX_MESSAGE_PUSH_PROVIDER_KEY?: string;
  MINIX_MESSAGE_PUSH_PROVIDER_LABEL?: string;
  MINIX_UPLOAD_PROVIDER_MODE?: string;
  MINIX_UPLOAD_STORAGE_PROVIDER?: string;
  MINIX_UPLOAD_REVIEW_PROVIDER?: string;
  MINIX_UPLOAD_ASSET_BASE_URL?: string;
  MINIX_SHARE_PROVIDER_MODE?: string;
  MINIX_SHARE_SHORT_LINK_PROVIDER?: string;
  MINIX_SHARE_POSTER_PROVIDER?: string;
  MINIX_SHARE_SHORT_LINK_BASE_URL?: string;
  MINIX_SHARE_POSTER_BASE_URL?: string;
  MINIX_PAYMENT_WEBHOOK_SECRET?: string;
  AUTH_RATE_LIMIT_KV?: KVNamespaceLike;
  DB?: D1DatabaseLike;
}

export interface LoginProfile {
  nickname: string;
  avatarUrl?: string;
}

export interface AuthPhoneVerificationRecord {
  verificationId: string;
  purpose: AuthVerificationPurpose;
  phoneNumber: string;
  codeHash: string;
  salt: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: number;
  createdAt: number;
  consumedAt?: number;
  deviceId?: string;
}

export interface AuthPasswordCredentialRecord {
  subject: string;
  userId: string;
  salt: string;
  passwordHash: string;
  failedAttempts: number;
  maxFailedAttempts: number;
  updatedAt: number;
  lockedUntil?: number;
}

export interface AuthOAuthStateRecord {
  provider: string;
  state: string;
  purpose?: "login" | "bind";
  ownerUserId?: string;
  expiresAt: number;
  createdAt: number;
  deviceId?: string;
  redirectTarget?: AuthRedirectTarget;
}

export interface AuthOAuthCredentialRecord {
  provider: string;
  providerUserId: string;
  userId: string;
  tokenHash: string;
  createdAt: number;
  linkedAt?: number;
  lastAuthorizedAt?: number;
  authorizationStatus?: "active" | "revoked" | "unlinked";
  revokedAt?: number;
  revocationReason?: string;
  expiresAt?: number;
}

export interface AuthSecurityState {
  phoneVerificationsById: Record<string, AuthPhoneVerificationRecord>;
  latestVerificationIdByPhonePurpose: Record<string, string>;
  passwordCredentialsBySubject: Record<string, AuthPasswordCredentialRecord>;
  oauthStatesByState: Record<string, AuthOAuthStateRecord>;
  oauthCredentialsByProviderSubject: Record<string, AuthOAuthCredentialRecord>;
  credentialProtectionBySubject: Record<string, AuthCredentialProtection>;
  devicesById: Record<string, AuthDeviceIdentity>;
  auditEvents: AuthSecurityAuditEvent[];
  rateLimitStatesByScope: Record<string, AuthRateLimitState>;
  latestPrompt?: AuthSecurityPrompt;
}

export interface StoredUploadRecord extends UploadPipelineResponse {
  selection: UploadSelectionResult;
  transfer?: UploadTransferPayload;
  session?: UploadSession;
  chunksByIndex: Record<string, UploadChunkReceipt>;
  binaryByChunkIndex: Record<string, string>;
  binaryObjectKey?: string;
  reviewRecord?: UploadReviewRecord;
  cleanupRecord?: UploadCleanupRecord;
  references: UploadReference[];
}

export interface StoredMessageThreadRecord {
  thread: MessageThread;
  messages: MessageBodyItem[];
  syncCursor: string;
  updatedAt: string;
}

export interface StoredNotificationTouchpointRecord extends MessageTouchpointReceipt {
  channel: MessageTouchpointChannel;
  providerKey: string;
  templateKey: string;
  locale: string;
}

export interface UserState {
  membershipPlanId?: PurchaseMembershipRequest["planId"];
  bookshelfNovelIds: Set<string>;
  progressByNovelId: Record<string, ReadingProgress>;
  notificationReadAtById: Record<string, string>;
  threadReadAtById: Record<string, string>;
  threadMessagesByThreadId: Record<string, MessageBodyItem[]>;
  threadRecordsById: Record<string, StoredMessageThreadRecord>;
  notificationTouchpointReceiptsByNotificationId?: Record<string, Record<string, StoredNotificationTouchpointRecord>>;
  feedbackDetailsById: Record<string, FeedbackTicketDetailResponse>;
  feedbackTicketIds: string[];
  feedbackFaqCatalog: FeedbackFaqEntry[];
  feedbackSupportEntries: FeedbackSupportEntry[];
  latestFeedbackTicketId?: string;
  latestPaidOrderId?: string;
  ordersById: Record<string, OrderDetailResponse>;
  orderIdByIdempotencyKey: Record<string, string>;
  afterSalesById: Record<string, AfterSalesCase>;
  sharePreparesById: Record<string, SharePrepareResponse>;
  uploadsByTaskId: Record<string, StoredUploadRecord>;
  assetLedgerEntries: UserAssetLedgerEntry[];
  settingsState?: {
    preferences?: {
      notificationsEnabled?: SettingsPreferences["notificationsEnabled"];
      device?: Partial<Pick<SettingsPreferences["device"], "networkStrategy" | "autoplay" | "weakNetworkMode">>;
      developerOptions?: Partial<SettingsPreferences["developerOptions"]>;
    };
    featureToggles?: Partial<Pick<SettingsFeatureToggles, "pushEnabled" | "smsEnabled" | "emailEnabled">>;
    notificationChannels?: Partial<
      Record<
        SettingsNotificationChannel,
        {
          enabled?: boolean;
          unsubscribed?: boolean;
          unsubscribedAt?: string;
        }
      >
    >;
    privacyOptions?: Partial<Pick<SettingsPrivacyOptions, "profileVisibility" | "personalizedRecommendations" | "searchHistoryEnabled" | "analyticsEnabled" | "screenshotFeedbackEnabled">>;
  };
  operationRecords: AccountOperationRecord[];
  operationCooldownsByKind: Partial<Record<AccountOperationKind, AccountOperationCooldown>>;
  pendingCancellation?: {
    requestedAt: string;
    effectiveAt: string;
    revokeUntil: string;
    reason?: "privacy" | "switching" | "other";
    details?: string;
  };
  boundPhoneNumber?: string;
  wechatBoundOverride?: boolean;
  profileOverrides?: {
    nickname?: string;
    region?: string;
    bio?: string;
    avatarAssetId?: string;
  };
  availabilityStatus?: UserAvailabilityStatus;
  relationTarget?: {
    targetUserId: string;
    displayName: string;
    following: boolean;
    followedBy: boolean;
    friend: boolean;
    friendState?: UserFriendState;
    blocked: boolean;
    remarkName?: string;
  };
  relationRecordsByUserId?: Record<
    string,
    {
      targetUserId: string;
      displayName: string;
      following: boolean;
      followedBy: boolean;
      friend: boolean;
      friendState?: UserFriendState;
      blocked: boolean;
      remarkName?: string;
      lastInteractionAt?: string;
    }
  >;
  managedContentById?: Record<
    string,
    {
      authorUserId: string;
      model: ContentModel;
      visibility: ContentVisibility;
      lifecycle: ContentLifecycle;
      authorLabel: string;
      title: string;
      subtitle?: string;
      summary: string;
      bodyPreview?: string;
      categoryKey: string;
      categoryLabel: string;
      tags: Array<{ key: string; label: string }>;
      coverAssetId?: string;
      attachments: ContentAttachmentReference[];
      reviewRecord: ContentReviewRecord;
      auditHistory: ContentAuditEntry[];
      actorRoles: ContentActorRole[];
      authoring: ContentAuthoringData;
    }
  >;
  pendingIdentityWorkflow?: AuthIdentityWorkflow;
  lastIdentityWorkflow?: AuthIdentityWorkflow;
  authSecurity?: AuthSecurityState;
}

export type OperationalDomainKey =
  | "sessions"
  | "credentials"
  | "orders"
  | "uploads"
  | "messages"
  | "content"
  | "feedback"
  | "audit_events";

export type OperationalMigrationStatus = "completed" | "skipped";
export type OperationalJobKind =
  | "upload_cleanup"
  | "payment_reconciliation"
  | "notification_retry"
  | "cancellation_expiry";
export type OperationalJobStatus = "queued" | "running" | "completed" | "failed" | "skipped";
export type OperationalMonitoringLevel = "info" | "warn" | "error";
export type OperationalAuditCategory = "job" | "migration" | "governance";

export interface OperationalDomainSchema {
  domain: OperationalDomainKey;
  schemaVersion: number;
  recordCount: number;
  lastRecordId?: string;
  lastBackfilledAt?: string;
}

export interface OperationalMigrationRecord {
  migrationId: string;
  target: "user_state" | "operational_state";
  fromVersion: number;
  toVersion: number;
  status: OperationalMigrationStatus;
  appliedAt: string;
  note: string;
}

export interface BackgroundJobRecord {
  jobId: string;
  kind: OperationalJobKind;
  status: OperationalJobStatus;
  userId: string;
  dedupeKey: string;
  relatedRecordId?: string;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  lastResult?: string;
}

export interface OperationalMonitoringEvent {
  eventId: string;
  level: OperationalMonitoringLevel;
  scope: "job" | "security" | "persistence";
  message: string;
  createdAt: string;
  jobId?: string;
  userId?: string;
  dedupeKey?: string;
}

export interface OperationalAuditRecord {
  auditId: string;
  category: OperationalAuditCategory;
  action: string;
  message: string;
  createdAt: string;
  userId?: string;
  recordId?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface OperationalState {
  schemaVersion: number;
  domainSchemas: OperationalDomainSchema[];
  migrations: OperationalMigrationRecord[];
  backgroundJobs: BackgroundJobRecord[];
  monitoringEvents: OperationalMonitoringEvent[];
  auditTrail: OperationalAuditRecord[];
  lastSweepAt?: string;
}

export interface SessionRecord {
  userId: string;
  platform: LoginPlatformKind;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  profile: LoginProfile;
  identity: AuthIdentity;
  authStatus: AuthStatus;
  loginMethod?: LoginMethod;
}

export interface CreateSessionInput {
  platform: LoginPlatformKind;
  userId?: string;
  profile?: LoginProfile;
  identity?: Partial<AuthIdentity>;
  authStatus?: AuthStatus;
  loginMethod?: LoginMethod;
}

export interface ApiStore {
  createSession(input: CreateSessionInput): Promise<SessionRecord>;
  refreshSession(platform: LoginPlatformKind, refreshToken: string): Promise<SessionRecord | null>;
  revokeSession(input: { accessToken?: string; refreshToken?: string }): Promise<void>;
  getSessionByAccessToken(accessToken: string): Promise<SessionRecord | null>;
  getUserState(userId: string): Promise<UserState>;
  saveUserState(userId: string, userState: UserState): Promise<void>;
  getOperationalState(): Promise<OperationalState>;
  saveOperationalState(state: OperationalState): Promise<void>;
}

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
}

export interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}
