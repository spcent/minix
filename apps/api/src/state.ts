import type {
  FeedbackFaqEntry,
  FeedbackSupportEntry,
  FeedbackTicketDetailResponse,
  MessageBodyItem,
  OrderDetailResponse,
  PurchaseMembershipRequest,
  ReadingProgress,
  SharePrepareResponse,
} from "@minix/contracts";

import { createDefaultOperationalState, createDefaultUserState } from "./data";
import type { OperationalState, StoredMessageThreadRecord, StoredUploadRecord, UserState } from "./types";

interface PersistedUserState {
  membershipPlanId?: PurchaseMembershipRequest["planId"];
  bookshelfNovelIds: string[];
  progressByNovelId: Record<string, ReadingProgress>;
  notificationReadAtById?: Record<string, string>;
  threadReadAtById?: Record<string, string>;
  threadMessagesByThreadId?: Record<string, MessageBodyItem[]>;
  threadRecordsById?: Record<string, StoredMessageThreadRecord>;
  operationRecords?: UserState["operationRecords"];
  operationCooldownsByKind?: UserState["operationCooldownsByKind"];
  pendingCancellation?: UserState["pendingCancellation"];
  feedbackDetailsById?: Record<string, FeedbackTicketDetailResponse>;
  feedbackTicketIds?: string[];
  feedbackFaqCatalog?: FeedbackFaqEntry[];
  feedbackSupportEntries?: FeedbackSupportEntry[];
  latestFeedbackTicketId?: string;
  latestPaidOrderId?: string;
  ordersById?: Record<string, OrderDetailResponse>;
  orderIdByIdempotencyKey?: Record<string, string>;
  afterSalesById?: UserState["afterSalesById"];
  sharePreparesById?: Record<string, SharePrepareResponse>;
  uploadsByTaskId?: Record<string, StoredUploadRecord>;
  assetLedgerEntries?: UserState["assetLedgerEntries"];
  settingsState?: UserState["settingsState"];
  boundPhoneNumber?: string;
  wechatBoundOverride?: boolean;
  profileOverrides?: UserState["profileOverrides"];
  availabilityStatus?: UserState["availabilityStatus"];
  relationTarget?: UserState["relationTarget"];
  relationRecordsByUserId?: UserState["relationRecordsByUserId"];
  managedContentById?: UserState["managedContentById"];
  pendingIdentityWorkflow?: UserState["pendingIdentityWorkflow"];
  lastIdentityWorkflow?: UserState["lastIdentityWorkflow"];
  authSecurity?: UserState["authSecurity"];
}

export function serializeUserState(userState: UserState): string {
  const persisted: PersistedUserState = {
    ...(userState.membershipPlanId ? { membershipPlanId: userState.membershipPlanId } : {}),
    bookshelfNovelIds: Array.from(userState.bookshelfNovelIds),
    progressByNovelId: userState.progressByNovelId,
    notificationReadAtById: userState.notificationReadAtById,
    threadReadAtById: userState.threadReadAtById,
    threadMessagesByThreadId: userState.threadMessagesByThreadId,
    threadRecordsById: userState.threadRecordsById,
    operationRecords: userState.operationRecords,
    operationCooldownsByKind: userState.operationCooldownsByKind,
    ...(userState.pendingCancellation ? { pendingCancellation: userState.pendingCancellation } : {}),
    feedbackDetailsById: userState.feedbackDetailsById,
    feedbackTicketIds: userState.feedbackTicketIds,
    feedbackFaqCatalog: userState.feedbackFaqCatalog,
    feedbackSupportEntries: userState.feedbackSupportEntries,
    ...(userState.latestFeedbackTicketId ? { latestFeedbackTicketId: userState.latestFeedbackTicketId } : {}),
    ...(userState.latestPaidOrderId ? { latestPaidOrderId: userState.latestPaidOrderId } : {}),
    ordersById: userState.ordersById,
    orderIdByIdempotencyKey: userState.orderIdByIdempotencyKey,
    afterSalesById: userState.afterSalesById,
    sharePreparesById: userState.sharePreparesById,
    uploadsByTaskId: userState.uploadsByTaskId,
    assetLedgerEntries: userState.assetLedgerEntries,
    ...(userState.settingsState ? { settingsState: userState.settingsState } : {}),
    ...(userState.boundPhoneNumber ? { boundPhoneNumber: userState.boundPhoneNumber } : {}),
    ...(userState.wechatBoundOverride !== undefined ? { wechatBoundOverride: userState.wechatBoundOverride } : {}),
    ...(userState.profileOverrides ? { profileOverrides: userState.profileOverrides } : {}),
    ...(userState.availabilityStatus ? { availabilityStatus: userState.availabilityStatus } : {}),
    ...(userState.relationTarget ? { relationTarget: userState.relationTarget } : {}),
    ...(userState.relationRecordsByUserId ? { relationRecordsByUserId: userState.relationRecordsByUserId } : {}),
    ...(userState.managedContentById ? { managedContentById: userState.managedContentById } : {}),
    ...(userState.pendingIdentityWorkflow ? { pendingIdentityWorkflow: userState.pendingIdentityWorkflow } : {}),
    ...(userState.lastIdentityWorkflow ? { lastIdentityWorkflow: userState.lastIdentityWorkflow } : {}),
    ...(userState.authSecurity ? { authSecurity: userState.authSecurity } : {}),
  };

  return JSON.stringify(persisted);
}

export function deserializeUserState(serialized: string | null | undefined): UserState {
  if (!serialized) {
    return createDefaultUserState();
  }

  const parsed = JSON.parse(serialized) as Partial<PersistedUserState>;
  return {
    ...(parsed.membershipPlanId ? { membershipPlanId: parsed.membershipPlanId } : {}),
    bookshelfNovelIds: new Set(parsed.bookshelfNovelIds ?? []),
    progressByNovelId: parsed.progressByNovelId ?? {},
    notificationReadAtById: parsed.notificationReadAtById ?? {},
    threadReadAtById: parsed.threadReadAtById ?? {},
    threadMessagesByThreadId: parsed.threadMessagesByThreadId ?? {},
    threadRecordsById: parsed.threadRecordsById ?? {},
    operationRecords: parsed.operationRecords ?? [],
    operationCooldownsByKind: parsed.operationCooldownsByKind ?? {},
    ...(parsed.pendingCancellation ? { pendingCancellation: parsed.pendingCancellation } : {}),
    feedbackDetailsById: parsed.feedbackDetailsById ?? {},
    feedbackTicketIds: parsed.feedbackTicketIds ?? [],
    feedbackFaqCatalog: parsed.feedbackFaqCatalog ?? [],
    feedbackSupportEntries: parsed.feedbackSupportEntries ?? [],
    ...(parsed.latestFeedbackTicketId ? { latestFeedbackTicketId: parsed.latestFeedbackTicketId } : {}),
    ...(parsed.latestPaidOrderId ? { latestPaidOrderId: parsed.latestPaidOrderId } : {}),
    ordersById: parsed.ordersById ?? {},
    orderIdByIdempotencyKey: parsed.orderIdByIdempotencyKey ?? {},
    afterSalesById: parsed.afterSalesById ?? {},
    sharePreparesById: parsed.sharePreparesById ?? {},
    uploadsByTaskId: parsed.uploadsByTaskId ?? {},
    assetLedgerEntries: parsed.assetLedgerEntries ?? [],
    ...(parsed.settingsState ? { settingsState: parsed.settingsState } : {}),
    ...(parsed.boundPhoneNumber ? { boundPhoneNumber: parsed.boundPhoneNumber } : {}),
    ...(parsed.wechatBoundOverride !== undefined ? { wechatBoundOverride: parsed.wechatBoundOverride } : {}),
    ...(parsed.profileOverrides ? { profileOverrides: parsed.profileOverrides } : {}),
    ...(parsed.availabilityStatus ? { availabilityStatus: parsed.availabilityStatus } : {}),
    ...(parsed.relationTarget ? { relationTarget: parsed.relationTarget } : {}),
    ...(parsed.relationRecordsByUserId ? { relationRecordsByUserId: parsed.relationRecordsByUserId } : {}),
    ...(parsed.managedContentById ? { managedContentById: parsed.managedContentById } : {}),
    ...(parsed.pendingIdentityWorkflow ? { pendingIdentityWorkflow: parsed.pendingIdentityWorkflow } : {}),
    ...(parsed.lastIdentityWorkflow ? { lastIdentityWorkflow: parsed.lastIdentityWorkflow } : {}),
    ...(parsed.authSecurity ? { authSecurity: parsed.authSecurity } : {}),
  };
}

export function serializeOperationalState(state: OperationalState): string {
  return JSON.stringify(state);
}

export function deserializeOperationalState(serialized: string | null | undefined): OperationalState {
  if (!serialized) {
    return createDefaultOperationalState();
  }

  const fallback = createDefaultOperationalState();
  const parsed = JSON.parse(serialized) as Partial<OperationalState>;
  return {
    schemaVersion: parsed.schemaVersion ?? fallback.schemaVersion,
    domainSchemas: parsed.domainSchemas ?? fallback.domainSchemas,
    migrations: parsed.migrations ?? fallback.migrations,
    backgroundJobs: parsed.backgroundJobs ?? [],
    monitoringEvents: parsed.monitoringEvents ?? [],
    auditTrail: parsed.auditTrail ?? [],
    ...(parsed.lastSweepAt ? { lastSweepAt: parsed.lastSweepAt } : {}),
  };
}
