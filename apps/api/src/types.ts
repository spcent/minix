import type {
  UserAvailabilityStatus,
  AuthCredentialProtection,
  AuthIdentityWorkflow,
  AuthVerificationPurpose,
  AuthIdentity,
  AuthStatus,
  AuthRedirectTarget,
  ContentLifecycle,
  ContentModel,
  ContentVisibility,
  FeedbackTicketDetailResponse,
  LoginMethod,
  LoginPlatformKind,
  MessageBodyItem,
  OrderDetailResponse,
  PurchaseMembershipRequest,
  ReadingProgress,
  SharePrepareResponse,
  UploadPipelineResponse,
} from "@minix/contracts";

export interface ApiBindings {
  MINIX_STORE?: ApiStore;
  MINIX_CORS_ALLOWED_ORIGINS?: string;
  MINIX_DEPLOY_ENV?: string;
  MINIX_AUTH_RATE_LIMIT_WINDOW_SECONDS?: string;
  MINIX_AUTH_LOGIN_MAX_ATTEMPTS?: string;
  MINIX_AUTH_REFRESH_MAX_ATTEMPTS?: string;
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
  expiresAt?: number;
}

export interface AuthSecurityState {
  phoneVerificationsById: Record<string, AuthPhoneVerificationRecord>;
  latestVerificationIdByPhonePurpose: Record<string, string>;
  passwordCredentialsBySubject: Record<string, AuthPasswordCredentialRecord>;
  oauthStatesByState: Record<string, AuthOAuthStateRecord>;
  oauthCredentialsByProviderSubject: Record<string, AuthOAuthCredentialRecord>;
  credentialProtectionBySubject: Record<string, AuthCredentialProtection>;
}

export interface UserState {
  membershipPlanId?: PurchaseMembershipRequest["planId"];
  bookshelfNovelIds: Set<string>;
  progressByNovelId: Record<string, ReadingProgress>;
  notificationReadAtById: Record<string, string>;
  threadReadAtById: Record<string, string>;
  threadMessagesByThreadId: Record<string, MessageBodyItem[]>;
  feedbackDetailsById: Record<string, FeedbackTicketDetailResponse>;
  latestFeedbackTicketId?: string;
  latestPaidOrderId?: string;
  ordersById: Record<string, OrderDetailResponse>;
  orderIdByIdempotencyKey: Record<string, string>;
  sharePreparesById: Record<string, SharePrepareResponse>;
  uploadsByTaskId: Record<string, UploadPipelineResponse>;
  boundPhoneNumber?: string;
  wechatBoundOverride?: boolean;
  profileOverrides?: {
    nickname?: string;
    region?: string;
    bio?: string;
  };
  availabilityStatus?: UserAvailabilityStatus;
  relationTarget?: {
    targetUserId: string;
    displayName: string;
    following: boolean;
    followedBy: boolean;
    friend: boolean;
    blocked: boolean;
    remarkName?: string;
  };
  managedContentById?: Record<
    string,
    {
      model: ContentModel;
      visibility: ContentVisibility;
      lifecycle: ContentLifecycle;
      authorLabel: string;
      summary: string;
      categoryKey: string;
      categoryLabel: string;
      tags: Array<{ key: string; label: string }>;
    }
  >;
  pendingIdentityWorkflow?: AuthIdentityWorkflow;
  lastIdentityWorkflow?: AuthIdentityWorkflow;
  authSecurity?: AuthSecurityState;
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
