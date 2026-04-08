import type { OrderDetailResponse, PurchaseMembershipRequest, ReadingProgress } from "@minix/contracts";

import { createDefaultUserState } from "./data";
import type { UserState } from "./types";

interface PersistedUserState {
  membershipPlanId?: PurchaseMembershipRequest["planId"];
  bookshelfNovelIds: string[];
  progressByNovelId: Record<string, ReadingProgress>;
  latestPaidOrderId?: string;
  ordersById?: Record<string, OrderDetailResponse>;
  orderIdByIdempotencyKey?: Record<string, string>;
}

export function serializeUserState(userState: UserState): string {
  const persisted: PersistedUserState = {
    ...(userState.membershipPlanId ? { membershipPlanId: userState.membershipPlanId } : {}),
    bookshelfNovelIds: Array.from(userState.bookshelfNovelIds),
    progressByNovelId: userState.progressByNovelId,
    ...(userState.latestPaidOrderId ? { latestPaidOrderId: userState.latestPaidOrderId } : {}),
    ordersById: userState.ordersById,
    orderIdByIdempotencyKey: userState.orderIdByIdempotencyKey,
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
    ...(parsed.latestPaidOrderId ? { latestPaidOrderId: parsed.latestPaidOrderId } : {}),
    ordersById: parsed.ordersById ?? {},
    orderIdByIdempotencyKey: parsed.orderIdByIdempotencyKey ?? {},
  };
}
