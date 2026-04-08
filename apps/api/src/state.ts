import type { FeedbackTicketDetailResponse, OrderDetailResponse, PurchaseMembershipRequest, ReadingProgress } from "@minix/contracts";

import { createDefaultUserState } from "./data";
import type { UserState } from "./types";

interface PersistedUserState {
  membershipPlanId?: PurchaseMembershipRequest["planId"];
  bookshelfNovelIds: string[];
  progressByNovelId: Record<string, ReadingProgress>;
  notificationReadAtById?: Record<string, string>;
  feedbackDetailsById?: Record<string, FeedbackTicketDetailResponse>;
  latestFeedbackTicketId?: string;
  latestPaidOrderId?: string;
  ordersById?: Record<string, OrderDetailResponse>;
  orderIdByIdempotencyKey?: Record<string, string>;
  boundPhoneNumber?: string;
  pendingIdentityWorkflow?: UserState["pendingIdentityWorkflow"];
  lastIdentityWorkflow?: UserState["lastIdentityWorkflow"];
}

export function serializeUserState(userState: UserState): string {
  const persisted: PersistedUserState = {
    ...(userState.membershipPlanId ? { membershipPlanId: userState.membershipPlanId } : {}),
    bookshelfNovelIds: Array.from(userState.bookshelfNovelIds),
    progressByNovelId: userState.progressByNovelId,
    notificationReadAtById: userState.notificationReadAtById,
    feedbackDetailsById: userState.feedbackDetailsById,
    ...(userState.latestFeedbackTicketId ? { latestFeedbackTicketId: userState.latestFeedbackTicketId } : {}),
    ...(userState.latestPaidOrderId ? { latestPaidOrderId: userState.latestPaidOrderId } : {}),
    ordersById: userState.ordersById,
    orderIdByIdempotencyKey: userState.orderIdByIdempotencyKey,
    ...(userState.boundPhoneNumber ? { boundPhoneNumber: userState.boundPhoneNumber } : {}),
    ...(userState.pendingIdentityWorkflow ? { pendingIdentityWorkflow: userState.pendingIdentityWorkflow } : {}),
    ...(userState.lastIdentityWorkflow ? { lastIdentityWorkflow: userState.lastIdentityWorkflow } : {}),
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
    feedbackDetailsById: parsed.feedbackDetailsById ?? {},
    ...(parsed.latestFeedbackTicketId ? { latestFeedbackTicketId: parsed.latestFeedbackTicketId } : {}),
    ...(parsed.latestPaidOrderId ? { latestPaidOrderId: parsed.latestPaidOrderId } : {}),
    ordersById: parsed.ordersById ?? {},
    orderIdByIdempotencyKey: parsed.orderIdByIdempotencyKey ?? {},
    ...(parsed.boundPhoneNumber ? { boundPhoneNumber: parsed.boundPhoneNumber } : {}),
    ...(parsed.pendingIdentityWorkflow ? { pendingIdentityWorkflow: parsed.pendingIdentityWorkflow } : {}),
    ...(parsed.lastIdentityWorkflow ? { lastIdentityWorkflow: parsed.lastIdentityWorkflow } : {}),
  };
}
