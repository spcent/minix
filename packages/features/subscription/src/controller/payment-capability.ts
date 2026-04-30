import {
  createCapabilityHealthSnapshot,
  describeCapabilityStatus,
  type AppKernel,
  type Store,
} from "@minix/core";
import type { CapabilityStatus, PurchaseMembershipResponse } from "@minix/contracts";

import type { SubscriptionState } from "../model";

export function isSamplePaymentProviderMode(providerMode: NonNullable<PurchaseMembershipResponse["paymentIntent"]["gatewayReference"]>["providerMode"]): boolean {
  return providerMode === "sample";
}

export function derivePaymentCapabilitySummary(status: CapabilityStatus | undefined) {
  const base = describeCapabilityStatus(
    status,
    "Payment capability status is unavailable until the host runtime reports it.",
  );
  if (!status || !status.available) {
    return `${base} Order creation can still succeed, but a host payment bridge is required before native payment execution can continue.`;
  }

  if (status.mode === "degraded") {
    return `${base} Host payment execution may still require a follow-up confirmation step.`;
  }

  return base;
}

export function syncPaymentCapabilityState(kernel: AppKernel, store: Store<SubscriptionState>) {
  const statusResult = kernel.capability?.status("payment");
  const paymentCapabilityStatus = statusResult?.ok ? statusResult.value : undefined;
  store.setState({
    paymentCapabilityStatus,
    paymentCapabilitySnapshot: createCapabilityHealthSnapshot(
      "payment",
      paymentCapabilityStatus,
      "Payment capability status is unavailable until the host runtime reports it.",
    ),
    paymentCapabilitySummary: derivePaymentCapabilitySummary(paymentCapabilityStatus),
  });

  return paymentCapabilityStatus;
}
