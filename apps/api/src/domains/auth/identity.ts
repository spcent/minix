import type {
  AuthIdentity,
  AuthIdentityAuditRecord,
  AuthIdentityFailureReason,
  AuthIdentityMergePreview,
  AuthIdentityWorkflow,
  AuthRedirectTarget,
  LoginMethod,
} from "@minix/contracts";

import type { UserState } from "../../types";
import { createRandomId, normalizePhoneNumber, sanitizeUserKey } from "./security";

export function createGuestUserId(anonymousId?: string): string {
  return anonymousId ? `guest_${sanitizeUserKey(anonymousId).slice(0, 32)}` : "guest_minix_demo";
}

export function createUserIdFromCredential(input: {
  method: Extract<LoginMethod, "guest" | "phone_code" | "password">;
  anonymousId?: string | undefined;
  phoneNumber?: string | undefined;
  account?: string | undefined;
}): string {
  switch (input.method) {
    case "guest":
      return createGuestUserId(input.anonymousId);
    case "phone_code":
      return input.phoneNumber
        ? `user_phone_${normalizePhoneNumber(input.phoneNumber).slice(-4)}`
        : "user_phone_demo";
    case "password":
      if (input.account) {
        return `user_account_${sanitizeUserKey(input.account)}`;
      }
      return input.phoneNumber
        ? `user_phone_${normalizePhoneNumber(input.phoneNumber).slice(-4)}`
        : "user_password_demo";
  }
}

export function createUserIdFromLogin(payload: {
  credential: {
    anonymousId?: string | undefined;
    phoneNumber?: string | undefined;
    account?: string | undefined;
    provider?: string | undefined;
    providerUserId?: string | undefined;
  };
}, method: LoginMethod): string {
  switch (method) {
    case "guest":
      return createUserIdFromCredential({
        method,
        ...(payload.credential.anonymousId
          ? { anonymousId: payload.credential.anonymousId }
          : {}),
      });
    case "phone_code":
      return createUserIdFromCredential({
        method,
        ...(payload.credential.phoneNumber
          ? { phoneNumber: payload.credential.phoneNumber }
          : {}),
      });
    case "password":
      return createUserIdFromCredential({
        method,
        ...(payload.credential.account ? { account: payload.credential.account } : {}),
        ...(payload.credential.phoneNumber
          ? { phoneNumber: payload.credential.phoneNumber }
          : {}),
      });
    case "oauth":
      return payload.credential.provider && payload.credential.providerUserId
        ? `user_oauth_${sanitizeUserKey(payload.credential.provider.toLowerCase())}_${sanitizeUserKey(payload.credential.providerUserId)}`
        : "user_oauth_pending";
    default:
      return "minix-demo-user";
  }
}

export function createUserIdFromUpgradeRequest(payload: {
  credential: {
    method: "phone_code" | "password";
    phoneNumber?: string | undefined;
    account?: string | undefined;
  };
}): string {
  return createUserIdFromCredential({
    method: payload.credential.method,
    ...(payload.credential.phoneNumber ? { phoneNumber: payload.credential.phoneNumber } : {}),
    ...(payload.credential.account ? { account: payload.credential.account } : {}),
  });
}

function createWorkflowMessage(
  kind: AuthIdentityWorkflow["kind"],
  status: AuthIdentityWorkflow["status"],
  targetLabel?: string,
): string {
  if (status === "merge_required") {
    return targetLabel
      ? `This identity is already linked to ${targetLabel}. Confirm the merge to continue.`
      : "This identity is already linked to another account. Confirm the merge to continue.";
  }

  if (status === "conflict") {
    return targetLabel
      ? `The current session conflicts with ${targetLabel}. Resolve the target account before retrying.`
      : "The current session conflicts with another account.";
  }

  if (kind === "guest_upgrade") {
    return "The guest session has been upgraded to a formal account.";
  }

  if (kind === "phone_binding") {
    return "The current account is now bound to the verified phone number.";
  }

  if (kind === "oauth_binding") {
    return status === "completed"
      ? targetLabel
        ? `${targetLabel} is now linked to the current account.`
        : "The OAuth provider is now linked to the current account."
      : "The OAuth provider requires account merge confirmation.";
  }

  return "The current session has been merged into the target account.";
}

function createWorkflowRecoverySummary(input: {
  kind: AuthIdentityWorkflow["kind"];
  status: AuthIdentityWorkflow["status"];
  mergePreview?: AuthIdentityMergePreview;
}): string {
  if (input.status === "merge_required") {
    return input.mergePreview?.recoveryMessage
      ?? "If the merge is not confirmed, the current session remains unchanged and can retry later.";
  }

  if (input.status === "blocked") {
    return "No merge was applied. Resolve the blocking condition and retry from the current identity workspace.";
  }

  if (input.kind === "guest_upgrade") {
    return "Guest upgrade stays inside the shared auth workspace until the formal account transition completes.";
  }

  if (input.kind === "phone_binding") {
    return "Phone binding can be retried from the current account workspace without a separate recovery route.";
  }

  if (input.kind === "oauth_binding") {
    return "OAuth binding can be reauthorized from the current login or account workspace without a dedicated callback page.";
  }

  return "The target account becomes the durable recovery point after merge completion.";
}

function createWorkflowOperatorActionSummary(input: {
  status: AuthIdentityWorkflow["status"];
  targetLabel?: string;
}): string | undefined {
  if (input.status === "merge_required") {
    return input.targetLabel
      ? `Review ownership of ${input.targetLabel} before confirming the merge.`
      : "Review ownership of the target account before confirming the merge.";
  }

  if (input.status === "conflict") {
    return "Resolve the conflicting provider or bound identity before retrying the transition.";
  }

  if (input.status === "blocked") {
    return "No identity transition was applied. Resolve the blocking condition before retrying.";
  }

  return undefined;
}

function countRecordValues(record: Record<string, unknown> | undefined): number {
  return record ? Object.keys(record).length : 0;
}

export function createMergePreview(input: {
  sourceUserId: string;
  targetUserId: string;
  targetLabel: string;
  sourceState: UserState;
  targetState: UserState;
  requiresConfirmation?: boolean;
  recoveryMessage?: string;
}): AuthIdentityMergePreview {
  const sourceMessageCount = Object.values(input.sourceState.threadMessagesByThreadId).reduce(
    (sum, items) => sum + items.length,
    0,
  );
  const targetMessageCount = Object.values(input.targetState.threadMessagesByThreadId).reduce(
    (sum, items) => sum + items.length,
    0,
  );
  const sourceFeedbackCount = countRecordValues(input.sourceState.feedbackDetailsById);
  const targetFeedbackCount = countRecordValues(input.targetState.feedbackDetailsById);
  const sourceContentCount = countRecordValues(input.sourceState.managedContentById);
  const targetContentCount = countRecordValues(input.targetState.managedContentById);
  const sourceAssetCount = countRecordValues(input.sourceState.uploadsByTaskId);
  const targetAssetCount = countRecordValues(input.targetState.uploadsByTaskId);

  return {
    sourceUserId: input.sourceUserId,
    targetUserId: input.targetUserId,
    targetLabel: input.targetLabel,
    requiresConfirmation: input.requiresConfirmation ?? true,
    canRollback: true,
    recoveryMessage:
      input.recoveryMessage ??
      "If confirmation fails, the source session remains unchanged and can retry the merge preview.",
    impacts: [
      {
        key: "assets",
        label: "Uploaded assets",
        sourceCount: sourceAssetCount,
        targetCount: targetAssetCount,
        mergedCount: sourceAssetCount + targetAssetCount,
        message: "Uploaded assets are combined and keep their existing task ids.",
      },
      {
        key: "messages",
        label: "Message threads",
        sourceCount: sourceMessageCount,
        targetCount: targetMessageCount,
        mergedCount: sourceMessageCount + targetMessageCount,
        message:
          "Thread read state and outbound message history are merged into the target account.",
      },
      {
        key: "feedback",
        label: "Feedback tickets",
        sourceCount: sourceFeedbackCount,
        targetCount: targetFeedbackCount,
        mergedCount: sourceFeedbackCount + targetFeedbackCount,
        message: "Feedback tickets and latest support context are preserved.",
      },
      {
        key: "content",
        label: "Managed content",
        sourceCount: sourceContentCount,
        targetCount: targetContentCount,
        mergedCount: sourceContentCount + targetContentCount,
        message: "Managed content lifecycle state follows the target account after merge.",
      },
      {
        key: "relationships",
        label: "Relationships",
        sourceCount: input.sourceState.relationTarget ? 1 : 0,
        targetCount: input.targetState.relationTarget ? 1 : 0,
        mergedCount: input.targetState.relationTarget || input.sourceState.relationTarget ? 1 : 0,
        message: "Relationship summary prefers the target account and backfills missing source state.",
      },
    ],
  };
}

export function createIdentityAuditRecord(input: {
  action: AuthIdentityAuditRecord["action"];
  workflowId: string;
  actorUserId: string;
  sourceUserId: string;
  targetUserId?: string;
  message: string;
}): AuthIdentityAuditRecord {
  return {
    eventId: createRandomId("identity_audit"),
    action: input.action,
    workflowId: input.workflowId,
    actorUserId: input.actorUserId,
    sourceUserId: input.sourceUserId,
    ...(input.targetUserId ? { targetUserId: input.targetUserId } : {}),
    message: input.message,
    createdAt: new Date().toISOString(),
  };
}

export function createIdentityWorkflow(input: {
  kind: AuthIdentityWorkflow["kind"];
  status: AuthIdentityWorkflow["status"];
  workflowId?: string | undefined;
  stage?: AuthIdentityWorkflow["stage"] | undefined;
  sourceUserId: string;
  continueTarget?: AuthRedirectTarget | undefined;
  targetUserId?: string | undefined;
  targetLabel?: string | undefined;
  failureReason?: AuthIdentityFailureReason | undefined;
  mergePreview?: AuthIdentityMergePreview | undefined;
  audit?: AuthIdentityAuditRecord[] | undefined;
}): AuthIdentityWorkflow {
  const operatorActionSummary = createWorkflowOperatorActionSummary({
    status: input.status,
    ...(input.targetLabel ? { targetLabel: input.targetLabel } : {}),
  });

  return {
    kind: input.kind,
    status: input.status,
    ...(input.workflowId ? { workflowId: input.workflowId } : {}),
    ...(input.stage ? { stage: input.stage } : {}),
    sourceUserId: input.sourceUserId,
    message: createWorkflowMessage(input.kind, input.status, input.targetLabel),
    ...(input.continueTarget ? { continueTarget: input.continueTarget } : {}),
    ...(input.targetUserId ? { targetUserId: input.targetUserId } : {}),
    ...(input.targetLabel ? { targetLabel: input.targetLabel } : {}),
    ...(input.failureReason ? { failureReason: input.failureReason } : {}),
    ...(input.mergePreview ? { mergePreview: input.mergePreview } : {}),
    ...(input.audit ? { audit: input.audit } : {}),
    recoverySummary: createWorkflowRecoverySummary({
      kind: input.kind,
      status: input.status,
      ...(input.mergePreview ? { mergePreview: input.mergePreview } : {}),
    }),
    ...(operatorActionSummary ? { operatorActionSummary } : {}),
  };
}

export function isMergeSampleIdentity(input: {
  phoneNumber?: string | undefined;
  account?: string | undefined;
}): boolean {
  return normalizePhoneNumber(input.phoneNumber ?? "") === "13800000001" || input.account === "minix-demo";
}

export function resolveAuthStatus(method: LoginMethod) {
  return method === "guest" ? "guest" : "authenticated";
}

export function resolveIdentity(input: {
  platform: "wechat" | "h5";
  credential: {
    phoneNumber?: string | undefined;
  };
}, userId: string, method: LoginMethod): AuthIdentity {
  const guest = resolveAuthStatus(method) === "guest";
  return {
    userId,
    ...(guest ? { anonymous: true } : {}),
    ...(input.platform === "wechat" || method === "wechat_code" ? { wechatBound: true } : {}),
    ...(method === "phone_code" || method === "password" ? { phoneBound: true } : {}),
  };
}

export function mergeUserStates(target: UserState, source: UserState): UserState {
  const mergedBookshelf = new Set<string>([
    ...target.bookshelfNovelIds,
    ...source.bookshelfNovelIds,
  ]);
  const latestPrompt = target.authSecurity?.latestPrompt ?? source.authSecurity?.latestPrompt;
  return {
    ...(target.membershipPlanId ?? source.membershipPlanId
      ? { membershipPlanId: target.membershipPlanId ?? source.membershipPlanId }
      : {}),
    assetLedgerEntries: [...(source.assetLedgerEntries ?? []), ...(target.assetLedgerEntries ?? [])],
    bookshelfNovelIds: mergedBookshelf,
    progressByNovelId: {
      ...source.progressByNovelId,
      ...target.progressByNovelId,
    },
    notificationReadAtById: {
      ...source.notificationReadAtById,
      ...target.notificationReadAtById,
    },
    threadReadAtById: {
      ...source.threadReadAtById,
      ...target.threadReadAtById,
    },
    threadMessagesByThreadId: {
      ...source.threadMessagesByThreadId,
      ...target.threadMessagesByThreadId,
    },
    threadRecordsById: {
      ...source.threadRecordsById,
      ...target.threadRecordsById,
    },
    operationRecords: [...(target.operationRecords ?? []), ...(source.operationRecords ?? [])].slice(0, 20),
    operationCooldownsByKind: {
      ...(source.operationCooldownsByKind ?? {}),
      ...(target.operationCooldownsByKind ?? {}),
    },
    ...(target.pendingCancellation ?? source.pendingCancellation
      ? { pendingCancellation: target.pendingCancellation ?? source.pendingCancellation }
      : {}),
    feedbackDetailsById: {
      ...source.feedbackDetailsById,
      ...target.feedbackDetailsById,
    },
    feedbackTicketIds: [...(source.feedbackTicketIds ?? []), ...(target.feedbackTicketIds ?? [])].filter(
      (ticketId, index, values) => values.indexOf(ticketId) === index,
    ),
    feedbackFaqCatalog:
      (target.feedbackFaqCatalog?.length ?? 0) > 0
        ? target.feedbackFaqCatalog
        : source.feedbackFaqCatalog,
    feedbackSupportEntries:
      (target.feedbackSupportEntries?.length ?? 0) > 0
        ? target.feedbackSupportEntries
        : source.feedbackSupportEntries,
    ...(target.latestFeedbackTicketId ?? source.latestFeedbackTicketId
      ? { latestFeedbackTicketId: target.latestFeedbackTicketId ?? source.latestFeedbackTicketId }
      : {}),
    ...(target.latestPaidOrderId ?? source.latestPaidOrderId
      ? { latestPaidOrderId: target.latestPaidOrderId ?? source.latestPaidOrderId }
      : {}),
    ordersById: {
      ...source.ordersById,
      ...target.ordersById,
    },
    orderIdByIdempotencyKey: {
      ...source.orderIdByIdempotencyKey,
      ...target.orderIdByIdempotencyKey,
    },
    afterSalesById: {
      ...source.afterSalesById,
      ...target.afterSalesById,
    },
    sharePreparesById: {
      ...source.sharePreparesById,
      ...target.sharePreparesById,
    },
    uploadsByTaskId: {
      ...source.uploadsByTaskId,
      ...target.uploadsByTaskId,
    },
    ...(target.boundPhoneNumber ?? source.boundPhoneNumber
      ? { boundPhoneNumber: target.boundPhoneNumber ?? source.boundPhoneNumber }
      : {}),
    ...(target.wechatBoundOverride !== undefined || source.wechatBoundOverride !== undefined
      ? { wechatBoundOverride: target.wechatBoundOverride ?? source.wechatBoundOverride }
      : {}),
    ...(target.profileOverrides ?? source.profileOverrides
      ? {
          profileOverrides: {
            ...(source.profileOverrides ?? {}),
            ...(target.profileOverrides ?? {}),
          },
        }
      : {}),
    ...(target.availabilityStatus ?? source.availabilityStatus
      ? { availabilityStatus: target.availabilityStatus ?? source.availabilityStatus }
      : {}),
    ...(target.relationTarget ?? source.relationTarget
      ? {
          relationTarget: {
            ...(source.relationTarget ?? {}),
            ...(target.relationTarget ?? {}),
          } as NonNullable<UserState["relationTarget"]>,
        }
      : {}),
    relationRecordsByUserId: {
      ...(source.relationRecordsByUserId ?? {}),
      ...(target.relationRecordsByUserId ?? {}),
    },
    notificationTouchpointReceiptsByNotificationId: {
      ...(source.notificationTouchpointReceiptsByNotificationId ?? {}),
      ...(target.notificationTouchpointReceiptsByNotificationId ?? {}),
    },
    settingsState: {
      ...(source.settingsState ?? {}),
      ...(target.settingsState ?? {}),
    },
    authSecurity: {
      ...(source.authSecurity ?? {}),
      ...(target.authSecurity ?? {}),
      ...(latestPrompt ? { latestPrompt } : {}),
      phoneVerificationsById: {
        ...(source.authSecurity?.phoneVerificationsById ?? {}),
        ...(target.authSecurity?.phoneVerificationsById ?? {}),
      },
      latestVerificationIdByPhonePurpose: {
        ...(source.authSecurity?.latestVerificationIdByPhonePurpose ?? {}),
        ...(target.authSecurity?.latestVerificationIdByPhonePurpose ?? {}),
      },
      passwordCredentialsBySubject: {
        ...(source.authSecurity?.passwordCredentialsBySubject ?? {}),
        ...(target.authSecurity?.passwordCredentialsBySubject ?? {}),
      },
      oauthStatesByState: {
        ...(source.authSecurity?.oauthStatesByState ?? {}),
        ...(target.authSecurity?.oauthStatesByState ?? {}),
      },
      oauthCredentialsByProviderSubject: {
        ...(source.authSecurity?.oauthCredentialsByProviderSubject ?? {}),
        ...(target.authSecurity?.oauthCredentialsByProviderSubject ?? {}),
      },
      credentialProtectionBySubject: {
        ...(source.authSecurity?.credentialProtectionBySubject ?? {}),
        ...(target.authSecurity?.credentialProtectionBySubject ?? {}),
      },
      devicesById: {
        ...(source.authSecurity?.devicesById ?? {}),
        ...(target.authSecurity?.devicesById ?? {}),
      },
      auditEvents: [
        ...(target.authSecurity?.auditEvents ?? []),
        ...(source.authSecurity?.auditEvents ?? []),
      ].slice(0, 50),
      rateLimitStatesByScope: {
        ...(source.authSecurity?.rateLimitStatesByScope ?? {}),
        ...(target.authSecurity?.rateLimitStatesByScope ?? {}),
      },
    },
    managedContentById: {
      ...(source.managedContentById ?? {}),
      ...(target.managedContentById ?? {}),
    },
    ...(target.pendingIdentityWorkflow ?? source.pendingIdentityWorkflow
      ? { pendingIdentityWorkflow: target.pendingIdentityWorkflow ?? source.pendingIdentityWorkflow }
      : {}),
    ...(target.lastIdentityWorkflow ?? source.lastIdentityWorkflow
      ? { lastIdentityWorkflow: target.lastIdentityWorkflow ?? source.lastIdentityWorkflow }
      : {}),
  };
}
