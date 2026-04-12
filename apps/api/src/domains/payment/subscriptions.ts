import type {
  PaymentSku,
  SubscriptionListResponse,
  SubscriptionRecord,
  SubscriptionStatus,
} from "@minix/contracts";

import type { UserState } from "../../types";
import { createSubscriptionRenewalDate } from "./catalog";

export function createSubscriptionRecord(input: {
  sku: PaymentSku;
  orderId: string;
  entitlementId?: string;
  now: string;
  status: SubscriptionStatus;
}): SubscriptionRecord {
  const renewsAt = createSubscriptionRenewalDate(input.now, input.sku.billingCycle);
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

function resolveSubscriptionLifecycle(
  subscription: SubscriptionRecord,
  now = new Date().toISOString(),
): SubscriptionRecord {
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
      latestById.set(
        detail.subscription.subscriptionId,
        resolveSubscriptionLifecycle(detail.subscription),
      );
    }
  }
  const subscriptions = Array.from(latestById.values()).sort((left, right) =>
    (right.renewsAt ?? right.startedAt ?? right.latestOrderId).localeCompare(
      left.renewsAt ?? left.startedAt ?? left.latestOrderId,
    ),
  );
  return {
    subscriptions,
    ...(subscriptions[0]?.subscriptionId
      ? { selectedSubscriptionId: subscriptions[0].subscriptionId }
      : {}),
  };
}
