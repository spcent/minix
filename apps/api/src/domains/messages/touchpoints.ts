import type {
  MessageBodyItem,
  MessageTouchpoint,
  MessageTouchpointChannel,
  MessageTouchpointProviderMode,
  MessageTouchpointReceiptStatus,
} from "@minix/contracts";

import { createDefaultUserState } from "../../data";
import {
  NOTIFICATION_CHANNEL_PROVIDER_CONFIG,
  resolveNotificationChannelProviderConfig,
  resolveSettingsState,
  type NotificationChannelProviderRuntimeEnv,
} from "../settings/state";
import { isSampleProviderMode } from "../provider-posture";
import type { StoredNotificationTouchpointRecord, UserState } from "../../types";

function createTouchpointTemplateKey(scope: string, channel: MessageTouchpointChannel) {
  return `${scope}.${channel}`;
}

function createTemplateGovernanceLabel(channel: MessageTouchpointChannel) {
  return channel === "in_app"
    ? "Shared in-app template"
    : `Shared ${channel.replace("_", " ")} template`;
}

function createTemplateOperatorActionSummary(
  channel: MessageTouchpointChannel,
  providerMode: MessageTouchpointProviderMode,
) {
  return channel === "in_app"
    ? "The in-app inbox template ships with the shared contract and does not require operator rollout."
    : isSampleProviderMode(providerMode)
      ? `Operators can promote the shared ${channel.replace("_", " ")} template from sample posture to a production provider without changing host logic.`
      : `Operators can rotate ${channel.replace("_", " ")} provider bindings while keeping the shared template key stable.`;
}

function createFallbackSummary(channel: MessageTouchpointChannel, enabled: boolean) {
  if (channel === "in_app") {
    return "This is the durable fallback lane for inbox and support continuity.";
  }
  return enabled
    ? "If this external lane fails or is skipped, the in-app inbox remains the durable fallback."
    : "This external lane is not active, so the in-app inbox remains the only durable fallback.";
}

function createReceiptAttemptSummary(receipt: MessageTouchpoint["receipt"] | undefined) {
  if (!receipt) {
    return undefined;
  }
  const attemptsLabel = receipt.retryCount > 0 ? `${receipt.retryCount + 1} attempts` : "1 attempt";
  switch (receipt.status) {
    case "queued":
      return `${attemptsLabel}; waiting for provider dispatch.`;
    case "sent":
      return `${attemptsLabel}; accepted by the provider and waiting for polling confirmation.`;
    case "delivered":
      return `${attemptsLabel}; delivery confirmed.`;
    case "failed":
      return `${attemptsLabel}; delivery failed${receipt.retryable ? " and can be retried" : ""}.`;
    case "skipped":
      return `${attemptsLabel}; skipped by current notification policy.`;
    case "opted_out":
      return `${attemptsLabel}; blocked because the user opted out.`;
    default:
      return undefined;
  }
}

function createDeliverySummary(touchpoint: MessageTouchpoint) {
  if (touchpoint.channel === "in_app") {
    return "Delivered through the shared in-app inbox lane.";
  }
  const channelLabel = touchpoint.channel.replace("_", " ");
  const providerLabel = touchpoint.providerLabel ?? touchpoint.providerKey ?? channelLabel;
  const status = touchpoint.receipt?.status;
  if (!touchpoint.enabled) {
    return `${providerLabel} is not active for ${channelLabel}; the shared inbox remains the durable delivery lane.`;
  }
  if (status === "failed") {
    return `${providerLabel} failed to deliver through ${channelLabel}; retry or operator intervention can restore the external lane.`;
  }
  if (status === "sent" || status === "queued") {
    return `${providerLabel} accepted the ${channelLabel} dispatch and polling will finalize the receipt.`;
  }
  if (status === "opted_out") {
    return `${providerLabel} did not deliver because the user opted out of ${channelLabel}.`;
  }
  if (status === "skipped") {
    return `${providerLabel} did not deliver because current policy disabled ${channelLabel}.`;
  }
  return `${providerLabel} delivered through ${channelLabel}.`;
}

function decorateTouchpointSummary(touchpoint: MessageTouchpoint): MessageTouchpoint {
  const attemptSummary = touchpoint.receipt ? createReceiptAttemptSummary(touchpoint.receipt) : undefined;
  return {
    ...touchpoint,
    deliverySummary: createDeliverySummary(touchpoint),
    ...(touchpoint.receipt
      ? {
          receipt: {
            ...touchpoint.receipt,
            ...(attemptSummary ? { attemptSummary } : {}),
          },
        }
      : {}),
  };
}

function createBaseTouchpoint(
  channel: MessageTouchpointChannel,
  scope: string,
  label: string,
  mode: MessageTouchpointProviderMode = "sample",
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
): MessageTouchpoint {
  if (channel === "in_app") {
    return {
      channel,
      executable: true,
      enabled: true,
      delivered: true,
      statusLabel: isSampleProviderMode(mode) ? "Visible in the in-app inbox as the durable fallback lane." : "Visible in the in-app inbox.",
      providerKey: "station_inbox",
      providerLabel: "Station Inbox",
      providerMode: mode,
      deliverySummary: "Delivered through the shared in-app inbox lane.",
      fallbackSummary: createFallbackSummary(channel, true),
      fallbackToInApp: false,
      templateKey: createTouchpointTemplateKey(scope, channel),
      template: {
        templateKey: createTouchpointTemplateKey(scope, channel),
        locale: "zh-CN",
        title: label,
        channelConstraint: channel,
        governanceLabel: createTemplateGovernanceLabel(channel),
        operatorActionSummary: createTemplateOperatorActionSummary(channel, mode),
      },
      receipt: {
        receiptId: `receipt_${scope}_${channel}`,
        status: "delivered",
        attemptedAt: "2026-04-01T08:00:00.000Z",
        deliveredAt: "2026-04-01T08:00:00.000Z",
        retryCount: 0,
        retryable: false,
        attemptSummary: "1 attempt; delivery confirmed.",
      },
    };
  }

  const provider = resolveNotificationChannelProviderConfig(channel, runtimeEnv);
  return {
    channel,
    executable: true,
    enabled: provider.defaultEnabled,
    statusLabel:
      isSampleProviderMode(mode)
        ? `${provider.providerLabel} is running in explicit sample mode for ${channel.replace("_", " ")} delivery.`
        : `${provider.providerLabel} is available for ${channel.replace("_", " ")} delivery.`,
    deliverySummary:
      isSampleProviderMode(mode)
        ? `${provider.providerLabel} exposes a sample ${channel.replace("_", " ")} delivery lane until operators wire a production provider.`
        : `${provider.providerLabel} is ready for ${channel.replace("_", " ")} delivery through the shared template.`,
    fallbackSummary: createFallbackSummary(channel, provider.defaultEnabled),
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
      governanceLabel: createTemplateGovernanceLabel(channel),
      operatorActionSummary: createTemplateOperatorActionSummary(channel, mode),
    },
  };
}

export const DEFAULT_MESSAGE_TOUCHPOINTS: MessageTouchpoint[] = [
  createBaseTouchpoint("in_app", "messages.default", "Default inbox delivery"),
  createBaseTouchpoint("subscription_message", "messages.default", "Default subscription delivery"),
  createBaseTouchpoint("sms", "messages.default", "Default SMS delivery"),
  createBaseTouchpoint("email", "messages.default", "Default email delivery"),
  createBaseTouchpoint("push", "messages.default", "Default push delivery"),
];

function ensureNotificationTouchpointState(userState: UserState) {
  userState.notificationTouchpointReceiptsByNotificationId ??= {};
  return userState.notificationTouchpointReceiptsByNotificationId;
}

function resolveChannelPreference(
  userState: UserState | undefined,
  channel: Exclude<MessageTouchpointChannel, "in_app">,
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
) {
  const settingsState = resolveSettingsState(userState ?? createDefaultUserState(), undefined, runtimeEnv);
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

function shouldSimulateProviderFailure(
  channel: Exclude<MessageTouchpointChannel, "in_app">,
  body: string | undefined,
) {
  if (!body) {
    return false;
  }
  const normalized = body.toLowerCase();
  if (normalized.includes("provider-down")) {
    return true;
  }
  const keyword = channel === "subscription_message" ? "subscription" : channel;
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
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
): MessageTouchpoint {
  if (touchpoint.channel === "in_app") {
    const attemptedAt = input.createdAt ?? "2026-04-01T08:00:00.000Z";
    return {
      ...touchpoint,
      executable: true,
      enabled: true,
      delivered: true,
      statusLabel: "Visible in the in-app inbox as the durable fallback lane.",
      deliverySummary: "Delivered through the shared in-app inbox lane.",
      fallbackSummary: createFallbackSummary("in_app", true),
      receipt: {
        receiptId: input.existingReceipt?.receiptId ?? `receipt_${input.resourceId}_in_app`,
        status: "delivered",
        attemptedAt,
        deliveredAt: attemptedAt,
        retryCount: 0,
        retryable: false,
        ...(input.existingReceipt?.providerReference
          ? { providerReference: input.existingReceipt.providerReference }
          : {}),
        attemptSummary: "1 attempt; delivery confirmed.",
      },
    };
  }

  const preference = resolveChannelPreference(userState, touchpoint.channel, runtimeEnv);
  const attemptedAt = input.createdAt ?? input.existingReceipt?.attemptedAt ?? "2026-04-01T08:00:00.000Z";
  const defaultProviderConfig = resolveNotificationChannelProviderConfig(touchpoint.channel, runtimeEnv);
  const providerMode =
    preference?.providerMode ?? touchpoint.providerMode ?? defaultProviderConfig.providerMode;
  const providerKey =
    preference?.providerKey ??
    touchpoint.providerKey ??
    defaultProviderConfig.providerKey;
  const providerLabel =
    preference?.providerLabel ??
    touchpoint.providerLabel ??
    defaultProviderConfig.providerLabel;
  const templateKey =
    touchpoint.template?.templateKey ??
    touchpoint.templateKey ??
    createTouchpointTemplateKey(input.resourceLabel, touchpoint.channel);
  const locale = touchpoint.template?.locale ?? preference?.locale ?? "zh-CN";
  if (!preference?.enabled) {
    return {
      ...touchpoint,
      enabled: false,
      providerKey,
      providerLabel,
      providerMode,
      delivered: false,
      statusLabel: preference?.unsubscribed
        ? `Unsubscribed from ${touchpoint.channel.replace("_", " ")} delivery.`
        : `Disabled by notification policy for ${touchpoint.channel.replace("_", " ")} delivery.`,
      deliverySummary: preference?.unsubscribed
        ? `${providerLabel} did not deliver because the user opted out of ${touchpoint.channel.replace("_", " ")}.`
        : `${providerLabel} did not deliver because current policy disabled ${touchpoint.channel.replace("_", " ")}.`,
      fallbackSummary: createFallbackSummary(touchpoint.channel, false),
      templateKey,
      template: {
        templateKey,
        locale,
        ...(touchpoint.template?.title ? { title: touchpoint.template.title } : {}),
        channelConstraint: touchpoint.channel,
        governanceLabel: touchpoint.template?.governanceLabel ?? createTemplateGovernanceLabel(touchpoint.channel),
        operatorActionSummary: createTemplateOperatorActionSummary(touchpoint.channel, providerMode),
      },
      receipt: {
        receiptId: input.existingReceipt?.receiptId ?? `receipt_${input.resourceId}_${touchpoint.channel}`,
        status: preference?.unsubscribed ? "opted_out" : "skipped",
        attemptedAt,
        retryCount: input.existingReceipt?.retryCount ?? 0,
        retryable: false,
        attemptSummary: preference?.unsubscribed
          ? `${(input.existingReceipt?.retryCount ?? 0) + 1} attempts; blocked because the user opted out.`
          : `${(input.existingReceipt?.retryCount ?? 0) + 1} attempts; skipped by current notification policy.`,
      },
    };
  }

  const failed = shouldSimulateProviderFailure(touchpoint.channel, input.body);
  const preferredStatus = input.preferredStatus ?? (failed ? "failed" : "delivered");
  return {
    ...touchpoint,
    enabled: true,
    providerKey,
    providerLabel,
    providerMode,
    delivered: preferredStatus === "delivered",
    statusLabel:
      preferredStatus === "failed"
        ? isSampleProviderMode(providerMode)
          ? `${providerLabel} sample delivery is temporarily unavailable.`
          : `${providerLabel} is temporarily unavailable.`
        : isSampleProviderMode(providerMode)
          ? `${providerLabel} sample delivery completed through ${touchpoint.channel.replace("_", " ")}.`
          : `${providerLabel} delivered through ${touchpoint.channel.replace("_", " ")}.`,
    fallbackSummary: createFallbackSummary(touchpoint.channel, true),
    templateKey,
    template: {
      templateKey,
      locale,
      ...(touchpoint.template?.title ? { title: touchpoint.template.title } : {}),
      channelConstraint: touchpoint.channel,
      governanceLabel: touchpoint.template?.governanceLabel ?? createTemplateGovernanceLabel(touchpoint.channel),
      operatorActionSummary: createTemplateOperatorActionSummary(touchpoint.channel, providerMode),
    },
    receipt: {
      receiptId: input.existingReceipt?.receiptId ?? `receipt_${input.resourceId}_${touchpoint.channel}`,
      status: preferredStatus,
      attemptedAt,
      ...(preferredStatus === "delivered" ? { deliveredAt: input.createdAt ?? attemptedAt } : {}),
      ...(preferredStatus === "failed" ? { failedAt: input.createdAt ?? attemptedAt } : {}),
      ...(preferredStatus === "failed" ? { failureCode: "PROVIDER_UNAVAILABLE" } : {}),
      ...(preferredStatus === "failed"
        ? {
            failureMessage:
              isSampleProviderMode(providerMode)
                ? `${providerLabel} sample delivery is unavailable.`
                : `${providerLabel} is unavailable.`,
          }
        : {}),
      retryCount: input.existingReceipt?.retryCount ?? 0,
      retryable: preferredStatus === "failed",
      ...(preferredStatus === "failed"
        ? { nextRetryAt: new Date(Date.parse(input.createdAt ?? attemptedAt) + 5 * 60 * 1000).toISOString() }
        : {}),
      providerReference: input.existingReceipt?.providerReference ?? `${providerKey}_${input.resourceId}`,
    },
  };
}

export function cloneTouchpoints(
  touchpoints: MessageTouchpoint[],
  userState?: UserState,
  input?: {
    resourceId?: string;
    resourceLabel?: string;
    createdAt?: string;
    body?: string;
  },
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
): MessageTouchpoint[] {
  if (!input?.resourceId || !input.resourceLabel) {
    return touchpoints.map((touchpoint) => {
      const nextTouchpoint = createDispatchTouchpoint(userState, touchpoint, {
        resourceId: `preview_${touchpoint.channel}`,
        resourceLabel: input?.resourceLabel ?? "preview",
        ...(input?.createdAt ? { createdAt: input.createdAt } : {}),
        ...(input?.body ? { body: input.body } : {}),
      }, runtimeEnv);
      return decorateTouchpointSummary(nextTouchpoint);
    });
  }

  if (input.resourceId.startsWith("notification:")) {
    const resourceId = input.resourceId;
    const resourceLabel = input.resourceLabel;
    const notificationId = input.resourceId.replace(/^notification:/, "");
    const storedReceipts =
      ensureNotificationTouchpointState(userState ?? createDefaultUserState())[notificationId] ?? {};
    const nextTouchpoints = touchpoints.map((touchpoint) => {
      const existingReceipt =
        touchpoint.channel === "in_app" ? undefined : storedReceipts[touchpoint.channel];
      const nextTouchpoint = createDispatchTouchpoint(userState, touchpoint, {
        resourceId,
        resourceLabel,
        ...(input.createdAt ? { createdAt: input.createdAt } : {}),
        ...(input.body ? { body: input.body } : {}),
        ...(existingReceipt ? { existingReceipt } : {}),
        ...(existingReceipt ? { preferredStatus: existingReceipt.status } : {}),
      }, runtimeEnv);
      if (touchpoint.channel !== "in_app" && nextTouchpoint.receipt) {
        storedReceipts[touchpoint.channel] = createStoredReceiptRecord({
          receiptId: nextTouchpoint.receipt.receiptId,
          channel: touchpoint.channel,
          providerKey:
            nextTouchpoint.providerKey ??
            NOTIFICATION_CHANNEL_PROVIDER_CONFIG[touchpoint.channel].providerKey,
          templateKey:
            nextTouchpoint.template?.templateKey ??
            nextTouchpoint.templateKey ??
            createTouchpointTemplateKey(resourceLabel, touchpoint.channel),
          locale: nextTouchpoint.template?.locale ?? "zh-CN",
          status: nextTouchpoint.receipt.status,
          ...(nextTouchpoint.receipt.attemptedAt
            ? { attemptedAt: nextTouchpoint.receipt.attemptedAt }
            : {}),
          ...(nextTouchpoint.receipt.deliveredAt
            ? { deliveredAt: nextTouchpoint.receipt.deliveredAt }
            : {}),
          ...(nextTouchpoint.receipt.failedAt ? { failedAt: nextTouchpoint.receipt.failedAt } : {}),
          ...(nextTouchpoint.receipt.failureCode
            ? { failureCode: nextTouchpoint.receipt.failureCode }
            : {}),
          ...(nextTouchpoint.receipt.failureMessage
            ? { failureMessage: nextTouchpoint.receipt.failureMessage }
            : {}),
          retryCount: nextTouchpoint.receipt.retryCount,
          retryable: nextTouchpoint.receipt.retryable,
          ...(nextTouchpoint.receipt.nextRetryAt
            ? { nextRetryAt: nextTouchpoint.receipt.nextRetryAt }
            : {}),
          ...(nextTouchpoint.receipt.providerReference
            ? { providerReference: nextTouchpoint.receipt.providerReference }
            : {}),
        });
      }
      return decorateTouchpointSummary(nextTouchpoint);
    });
    ensureNotificationTouchpointState(userState ?? createDefaultUserState())[notificationId] =
      storedReceipts;
    return nextTouchpoints;
  }

  return touchpoints.map((touchpoint) => {
    const nextTouchpoint = createDispatchTouchpoint(userState, touchpoint, {
      resourceId: input.resourceId!,
      resourceLabel: input.resourceLabel!,
      ...(input.createdAt ? { createdAt: input.createdAt } : {}),
      ...(input.body ? { body: input.body } : {}),
      ...(touchpoint.channel !== "in_app" && touchpoint.receipt
        ? {
            existingReceipt: createStoredReceiptRecord({
              receiptId: touchpoint.receipt.receiptId,
              channel: touchpoint.channel,
              providerKey:
                touchpoint.providerKey ??
                NOTIFICATION_CHANNEL_PROVIDER_CONFIG[touchpoint.channel].providerKey,
              templateKey:
                touchpoint.template?.templateKey ??
                touchpoint.templateKey ??
                createTouchpointTemplateKey(input.resourceLabel!, touchpoint.channel),
              locale: touchpoint.template?.locale ?? "zh-CN",
              status: touchpoint.receipt.status,
              ...(touchpoint.receipt.attemptedAt
                ? { attemptedAt: touchpoint.receipt.attemptedAt }
                : {}),
              ...(touchpoint.receipt.deliveredAt
                ? { deliveredAt: touchpoint.receipt.deliveredAt }
                : {}),
              ...(touchpoint.receipt.failedAt ? { failedAt: touchpoint.receipt.failedAt } : {}),
              ...(touchpoint.receipt.failureCode
                ? { failureCode: touchpoint.receipt.failureCode }
                : {}),
              ...(touchpoint.receipt.failureMessage
                ? { failureMessage: touchpoint.receipt.failureMessage }
                : {}),
              retryCount: touchpoint.receipt.retryCount,
              retryable: touchpoint.receipt.retryable,
              ...(touchpoint.receipt.nextRetryAt
                ? { nextRetryAt: touchpoint.receipt.nextRetryAt }
                : {}),
              ...(touchpoint.receipt.providerReference
                ? { providerReference: touchpoint.receipt.providerReference }
                : {}),
            }),
            preferredStatus: touchpoint.receipt.status,
          }
        : {}),
    }, runtimeEnv);
    return decorateTouchpointSummary(nextTouchpoint);
  });
}

export function cloneMessageTouchpointsForItem(
  message: MessageBodyItem,
  userState?: UserState,
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
) {
  return cloneTouchpoints(message.touchpoints, userState, {
    resourceId: `message:${message.messageId}`,
    resourceLabel: `message.${message.direction}`,
    createdAt: message.createdAt,
    body: message.body,
  }, runtimeEnv);
}
