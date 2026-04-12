import type {
  RegisterFeedbackRoutesOptions,
} from "./domains/feedback/routes";
import type {
  RegisterMessageRoutesOptions,
} from "./domains/messages/routes";
import type {
  RegisterPaymentRoutesOptions,
} from "./domains/payment/routes";
import type {
  RegisterShareRoutesOptions,
} from "./domains/share/routes";
import type {
  RegisterUploadRoutesOptions,
} from "./domains/uploads/routes";

import { registerFeedbackRoutes } from "./domains/feedback/routes";
import { registerMessageRoutes } from "./domains/messages/routes";
import { registerPaymentRoutes } from "./domains/payment/routes";
import { registerShareRoutes } from "./domains/share/routes";
import { registerUploadRoutes } from "./domains/uploads/routes";
import type { RegisterApiRouteGroupsOptions } from "./app-composition.route-groups.types";

export function registerCommerceAndGrowthRouteGroups(options: RegisterApiRouteGroupsOptions) {
  const { app, requireSession, resolveStore, security, jobs } = options;

  const guardPaymentRateLimit: RegisterPaymentRoutesOptions["guardPaymentRateLimit"] =
    security.createScopedRateLimitGuard({
      action: "payment",
      scope: "payment",
      blockedAction: "payment_purchase_rate_limited",
      blockedMessage: "Too many payment attempts. Retry later.",
    });
  const appendPaymentAudit: RegisterPaymentRoutesOptions["appendPaymentAudit"] =
    security.createScopedAuditAppender({
      scope: "payment",
      action: (input) => input.action,
      result: (input) => input.result,
      message: (input) => input.message,
    });
  const guardSharePrepareRateLimit: RegisterShareRoutesOptions["guardSharePrepareRateLimit"] =
    security.createScopedRateLimitGuard({
      action: "share",
      scope: "share",
      blockedAction: "share_prepare_rate_limited",
      blockedMessage: "Too many share preparations. Retry later.",
    });
  const appendSharePrepareAudit: RegisterShareRoutesOptions["appendSharePrepareAudit"] =
    security.createScopedAuditAppender({
      scope: "share",
      action: "share_prepare",
      result: "allowed",
      message: "Share payload prepared.",
    });
  const guardUploadSessionRateLimit: RegisterUploadRoutesOptions["guardUploadSessionRateLimit"] =
    security.createScopedRateLimitGuard({
      action: "upload",
      scope: "upload",
      blockedAction: "upload_session_rate_limited",
      blockedMessage: "Too many upload sessions. Retry later.",
    });
  const appendUploadSessionAudit: RegisterUploadRoutesOptions["appendUploadSessionAudit"] =
    security.createScopedAuditAppender({
      scope: "upload",
      action: "upload_session_create",
      result: "allowed",
      message: "Upload session created.",
    });
  const guardFeedbackSubmitRateLimit: RegisterFeedbackRoutesOptions["guardFeedbackSubmitRateLimit"] =
    security.createScopedRateLimitGuard({
      action: "feedback",
      scope: "feedback",
      blockedAction: "feedback_submit_rate_limited",
      blockedMessage: "Too many feedback submissions. Retry later.",
    });
  const appendFeedbackSubmitAudit: RegisterFeedbackRoutesOptions["appendFeedbackSubmitAudit"] =
    security.createScopedAuditAppender({
      scope: "feedback",
      action: "feedback_submit",
      result: "allowed",
      message: (input) => `Feedback ticket ${input.ticketId} submitted.`,
    });
  const guardMessageRateLimit: RegisterMessageRoutesOptions["guardMessageRateLimit"] =
    security.createScopedRateLimitGuard({
      action: "messages",
      scope: "messages",
      blockedAction: (input) =>
        input.action === "thread_create"
          ? "messages_thread_create_rate_limited"
          : "messages_send_rate_limited",
      blockedMessage: "Too many message operations. Retry later.",
    });
  const appendMessageAudit: RegisterMessageRoutesOptions["appendMessageAudit"] =
    security.createScopedAuditAppender({
      scope: "messages",
      action: (input) => input.action,
      result: "allowed",
      message: (input) =>
        input.action === "thread_create" ? "Message thread created." : "Message sent into thread.",
    });

  registerPaymentRoutes({
    app,
    requireSession,
    resolveStore,
    resolveClientId: security.resolveClientId,
    resolveRequestDeviceId: security.resolveRequestDeviceId,
    guardPaymentRateLimit,
    appendPaymentAudit,
    schedulePaymentReconciliation: jobs.schedulePaymentReconciliation,
    resolveWebhookSecret: (env) =>
      typeof env?.MINIX_PAYMENT_WEBHOOK_SECRET === "string"
        ? env.MINIX_PAYMENT_WEBHOOK_SECRET
        : "minix-local-payment-secret",
  });

  registerShareRoutes({
    app,
    requireSession,
    resolveStore,
    resolveClientId: security.resolveClientId,
    resolveRequestDeviceId: security.resolveRequestDeviceId,
    guardSharePrepareRateLimit,
    appendSharePrepareAudit,
  });

  registerUploadRoutes({
    app,
    requireSession,
    resolveStore,
    resolveClientId: security.resolveClientId,
    resolveRequestDeviceId: security.resolveRequestDeviceId,
    guardUploadSessionRateLimit,
    appendUploadSessionAudit,
    scheduleUploadCleanupJob: jobs.scheduleUploadCleanup,
  });

  registerFeedbackRoutes({
    app,
    requireSession,
    resolveStore,
    resolveClientId: security.resolveClientId,
    resolveRequestDeviceId: security.resolveRequestDeviceId,
    guardFeedbackSubmitRateLimit,
    appendFeedbackSubmitAudit,
  });

  registerMessageRoutes({
    app,
    requireSession,
    resolveStore,
    resolveClientId: security.resolveClientId,
    resolveRequestDeviceId: security.resolveRequestDeviceId,
    guardMessageRateLimit,
    appendMessageAudit,
    scheduleMessageRetryJob: jobs.scheduleMessageRetry,
  });
}
