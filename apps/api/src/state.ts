import type {
  FeedbackTicketDetailResponse,
  MessageBodyItem,
  OrderDetailResponse,
  PurchaseMembershipRequest,
  ReadingProgress,
  SharePrepareResponse,
  UploadPipelineResponse,
} from "@minix/contracts";

import { createDefaultUserState } from "./data";
import type { UserState } from "./types";

interface PersistedUserState {
  membershipPlanId?: PurchaseMembershipRequest["planId"];
  bookshelfNovelIds: string[];
  progressByNovelId: Record<string, ReadingProgress>;
  notificationReadAtById?: Record<string, string>;
  threadReadAtById?: Record<string, string>;
  threadMessagesByThreadId?: Record<string, MessageBodyItem[]>;
  feedbackDetailsById?: Record<string, FeedbackTicketDetailResponse>;
  latestFeedbackTicketId?: string;
  latestPaidOrderId?: string;
  ordersById?: Record<string, OrderDetailResponse>;
  orderIdByIdempotencyKey?: Record<string, string>;
  sharePreparesById?: Record<string, SharePrepareResponse>;
  uploadsByTaskId?: Record<string, UploadPipelineResponse>;
  boundPhoneNumber?: string;
  wechatBoundOverride?: boolean;
  profileOverrides?: UserState["profileOverrides"];
  availabilityStatus?: UserState["availabilityStatus"];
  relationTarget?: UserState["relationTarget"];
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
    feedbackDetailsById: userState.feedbackDetailsById,
    ...(userState.latestFeedbackTicketId ? { latestFeedbackTicketId: userState.latestFeedbackTicketId } : {}),
    ...(userState.latestPaidOrderId ? { latestPaidOrderId: userState.latestPaidOrderId } : {}),
    ordersById: userState.ordersById,
    orderIdByIdempotencyKey: userState.orderIdByIdempotencyKey,
    sharePreparesById: userState.sharePreparesById,
    uploadsByTaskId: userState.uploadsByTaskId,
    ...(userState.boundPhoneNumber ? { boundPhoneNumber: userState.boundPhoneNumber } : {}),
    ...(userState.wechatBoundOverride !== undefined ? { wechatBoundOverride: userState.wechatBoundOverride } : {}),
    ...(userState.profileOverrides ? { profileOverrides: userState.profileOverrides } : {}),
    ...(userState.availabilityStatus ? { availabilityStatus: userState.availabilityStatus } : {}),
    ...(userState.relationTarget ? { relationTarget: userState.relationTarget } : {}),
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
    feedbackDetailsById: parsed.feedbackDetailsById ?? {},
    ...(parsed.latestFeedbackTicketId ? { latestFeedbackTicketId: parsed.latestFeedbackTicketId } : {}),
    ...(parsed.latestPaidOrderId ? { latestPaidOrderId: parsed.latestPaidOrderId } : {}),
    ordersById: parsed.ordersById ?? {},
    orderIdByIdempotencyKey: parsed.orderIdByIdempotencyKey ?? {},
    sharePreparesById: parsed.sharePreparesById ?? {},
    uploadsByTaskId: parsed.uploadsByTaskId ?? {},
    ...(parsed.boundPhoneNumber ? { boundPhoneNumber: parsed.boundPhoneNumber } : {}),
    ...(parsed.wechatBoundOverride !== undefined ? { wechatBoundOverride: parsed.wechatBoundOverride } : {}),
    ...(parsed.profileOverrides ? { profileOverrides: parsed.profileOverrides } : {}),
    ...(parsed.availabilityStatus ? { availabilityStatus: parsed.availabilityStatus } : {}),
    ...(parsed.relationTarget ? { relationTarget: parsed.relationTarget } : {}),
    ...(parsed.managedContentById ? { managedContentById: parsed.managedContentById } : {}),
    ...(parsed.pendingIdentityWorkflow ? { pendingIdentityWorkflow: parsed.pendingIdentityWorkflow } : {}),
    ...(parsed.lastIdentityWorkflow ? { lastIdentityWorkflow: parsed.lastIdentityWorkflow } : {}),
    ...(parsed.authSecurity ? { authSecurity: parsed.authSecurity } : {}),
  };
}
