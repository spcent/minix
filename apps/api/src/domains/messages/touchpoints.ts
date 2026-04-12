import type {
  MessageBodyItem,
  MessageTouchpoint,
  MessageTouchpointChannel,
  MessageTouchpointProviderMode,
  MessageTouchpointReceiptStatus,
} from "@minix/contracts";

import { createDefaultUserState } from "../../data";
import { NOTIFICATION_CHANNEL_PROVIDER_CONFIG, resolveSettingsState } from "../settings/state";
import type { StoredNotificationTouchpointRecord, UserState } from "../../types";

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
      statusLabel: mode === "sample" ? "Visible in the in-app inbox as the durable fallback lane." : "Visible in the in-app inbox.",
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
    statusLabel:
      mode === "sample"
        ? `${provider.providerLabel} is running in explicit sample mode for ${channel.replace("_", " ")} delivery.`
        : `${provider.providerLabel} is available for ${channel.replace("_", " ")} delivery.`,
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
): MessageTouchpoint {
  if (touchpoint.channel === "in_app") {
    const attemptedAt = input.createdAt ?? "2026-04-01T08:00:00.000Z";
    return {
      ...touchpoint,
      executable: true,
      enabled: true,
      delivered: true,
      statusLabel: "Visible in the in-app inbox as the durable fallback lane.",
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
      },
    };
  }

  const preference = resolveChannelPreference(userState, touchpoint.channel);
  const attemptedAt = input.createdAt ?? input.existingReceipt?.attemptedAt ?? "2026-04-01T08:00:00.000Z";
  const providerKey =
    touchpoint.providerKey ??
    preference?.providerKey ??
    NOTIFICATION_CHANNEL_PROVIDER_CONFIG[touchpoint.channel].providerKey;
  const templateKey =
    touchpoint.template?.templateKey ??
    touchpoint.templateKey ??
    createTouchpointTemplateKey(input.resourceLabel, touchpoint.channel);
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
          ? `${touchpoint.providerLabel ?? providerKey} sample delivery is temporarily unavailable.`
          : touchpoint.providerMode === "sample"
            ? `${touchpoint.providerLabel ?? providerKey} sample delivery completed through ${touchpoint.channel.replace("_", " ")}.`
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
      ...(preferredStatus === "failed"
        ? { failureMessage: `${touchpoint.providerLabel ?? providerKey} sample delivery is unavailable.` }
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
): MessageTouchpoint[] {
  if (!input?.resourceId || !input.resourceLabel) {
    return touchpoints.map((touchpoint) =>
      createDispatchTouchpoint(userState, touchpoint, {
        resourceId: `preview_${touchpoint.channel}`,
        resourceLabel: input?.resourceLabel ?? "preview",
        ...(input?.createdAt ? { createdAt: input.createdAt } : {}),
        ...(input?.body ? { body: input.body } : {}),
      }),
    );
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
      });
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
      return nextTouchpoint;
    });
    ensureNotificationTouchpointState(userState ?? createDefaultUserState())[notificationId] =
      storedReceipts;
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
    }),
  );
}

export function cloneMessageTouchpointsForItem(message: MessageBodyItem, userState?: UserState) {
  return cloneTouchpoints(message.touchpoints, userState, {
    resourceId: `message:${message.messageId}`,
    resourceLabel: `message.${message.direction}`,
    createdAt: message.createdAt,
    body: message.body,
  });
}
