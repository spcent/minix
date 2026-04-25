import type { AccountOperationRecord } from "@minix/contracts";

import type {
  ApiStore,
  BackgroundJobRecord,
  OperationalAuditRecord,
  OperationalDomainKey,
  OperationalState,
  UserState,
} from "../../types";
import { cloneDomainSnapshot } from "../snapshot";

const OPERATIONAL_STATE_SCHEMA_VERSION = 1;

function createRandomId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function createOperationalDomainSchema(domain: OperationalDomainKey): OperationalState["domainSchemas"][number] {
  return {
    domain,
    schemaVersion: 1,
    recordCount: 0,
  };
}

export function createDefaultOperationalState(): OperationalState {
  const appliedAt = "2026-04-11T00:00:00.000Z";
  return {
    schemaVersion: OPERATIONAL_STATE_SCHEMA_VERSION,
    domainSchemas: [
      createOperationalDomainSchema("sessions"),
      createOperationalDomainSchema("credentials"),
      createOperationalDomainSchema("orders"),
      createOperationalDomainSchema("uploads"),
      createOperationalDomainSchema("messages"),
      createOperationalDomainSchema("content"),
      createOperationalDomainSchema("feedback"),
      createOperationalDomainSchema("audit_events"),
    ],
    migrations: [
      {
        migrationId: "ops_state_v1",
        target: "operational_state",
        fromVersion: 0,
        toVersion: OPERATIONAL_STATE_SCHEMA_VERSION,
        status: "completed",
        appliedAt,
        note: "Initial operational state baseline for durable governance metadata and background jobs.",
      },
    ],
    backgroundJobs: [],
    monitoringEvents: [],
    auditTrail: [],
  };
}

export function cloneOperationalState(state: OperationalState): OperationalState {
  return cloneDomainSnapshot(state);
}

export function appendOperationalMonitoringEvent(
  state: OperationalState,
  input: Omit<OperationalState["monitoringEvents"][number], "eventId">,
) {
  const event = {
    eventId: createRandomId("ops_event"),
    ...input,
  };
  state.monitoringEvents = [event, ...state.monitoringEvents].slice(0, 100);
  return event;
}

export function appendOperationalAuditRecord(
  state: OperationalState,
  input: Omit<OperationalAuditRecord, "auditId">,
) {
  const audit = {
    auditId: createRandomId("ops_audit"),
    ...input,
  };
  state.auditTrail = [audit, ...state.auditTrail].slice(0, 200);
  return audit;
}

export function upsertOperationalDomainSchema(
  state: OperationalState,
  input: {
    domain: OperationalDomainKey;
    recordCount: number;
    nowIso: string;
    lastRecordId?: string;
  },
) {
  const existing = state.domainSchemas.find((item) => item.domain === input.domain);
  if (existing) {
    existing.recordCount = input.recordCount;
    existing.lastBackfilledAt = input.nowIso;
    if (input.lastRecordId !== undefined) {
      existing.lastRecordId = input.lastRecordId;
    }
    return;
  }

  state.domainSchemas.push({
    domain: input.domain,
    schemaVersion: 1,
    recordCount: input.recordCount,
    lastBackfilledAt: input.nowIso,
    ...(input.lastRecordId !== undefined ? { lastRecordId: input.lastRecordId } : {}),
  });
}

function countFailedNotificationRetries(userState: UserState): number {
  const failedThreadMessages = Object.values(userState.threadRecordsById)
    .flatMap((record) => record.messages)
    .filter((message) => message.deliveryStatus === "failed" && message.retryable).length;
  const failedNotificationReceipts = Object.values(userState.notificationTouchpointReceiptsByNotificationId ?? {})
    .flatMap((entry) => Object.values(entry))
    .filter((receipt) => receipt.status === "failed" && receipt.retryable).length;
  return failedThreadMessages + failedNotificationReceipts;
}

export function syncOperationalDomainSchemas(
  state: OperationalState,
  input: {
    userId: string;
    userState: UserState;
    nowIso: string;
    sessionCount?: number;
  },
) {
  const { userState, nowIso } = input;
  upsertOperationalDomainSchema(state, {
    domain: "sessions",
    recordCount: input.sessionCount ?? 1,
    nowIso,
    lastRecordId: input.userId,
  });
  upsertOperationalDomainSchema(state, {
    domain: "credentials",
    recordCount:
      Object.keys(userState.authSecurity?.passwordCredentialsBySubject ?? {}).length +
      Object.keys(userState.authSecurity?.oauthCredentialsByProviderSubject ?? {}).length +
      Object.keys(userState.authSecurity?.phoneVerificationsById ?? {}).length,
    nowIso,
  });
  upsertOperationalDomainSchema(state, {
    domain: "orders",
    recordCount: Object.keys(userState.ordersById).length,
    nowIso,
    ...(userState.latestPaidOrderId ? { lastRecordId: userState.latestPaidOrderId } : {}),
  });
  upsertOperationalDomainSchema(state, {
    domain: "uploads",
    recordCount: Object.keys(userState.uploadsByTaskId).length,
    nowIso,
  });
  upsertOperationalDomainSchema(state, {
    domain: "messages",
    recordCount:
      Object.keys(userState.threadRecordsById).length +
      Object.values(userState.threadRecordsById).reduce((sum, record) => sum + record.messages.length, 0),
    nowIso,
  });
  upsertOperationalDomainSchema(state, {
    domain: "content",
    recordCount: Object.keys(userState.managedContentById ?? {}).length,
    nowIso,
  });
  upsertOperationalDomainSchema(state, {
    domain: "feedback",
    recordCount: userState.feedbackTicketIds.length,
    nowIso,
    ...(userState.latestFeedbackTicketId ? { lastRecordId: userState.latestFeedbackTicketId } : {}),
  });
  upsertOperationalDomainSchema(state, {
    domain: "audit_events",
    recordCount:
      (userState.authSecurity?.auditEvents.length ?? 0) +
      userState.operationRecords.length +
      state.auditTrail.length,
    nowIso,
  });
}

export function ensureOperationalBackfill(state: OperationalState, nowIso: string) {
  if (state.migrations.some((item) => item.migrationId === "user_state_backfill_v1")) {
    return;
  }

  const backfillMigration: OperationalState["migrations"][number] = {
    migrationId: "user_state_backfill_v1",
    target: "user_state",
    fromVersion: 0,
    toVersion: 1,
    status: "completed",
    appliedAt: nowIso,
    note: "Backfilled operational governance metadata from persisted user state records.",
  };

  state.migrations = [backfillMigration, ...state.migrations].slice(0, 50);
}

export function scheduleOperationalJob(
  state: OperationalState,
  input: {
    kind: BackgroundJobRecord["kind"];
    userId: string;
    dedupeKey: string;
    scheduledAt: string;
    relatedRecordId?: string;
    maxAttempts?: number;
  },
) {
  const existing = state.backgroundJobs.find(
    (job) => job.userId === input.userId && job.kind === input.kind && job.dedupeKey === input.dedupeKey && job.status !== "failed",
  );
  if (existing) {
    return existing;
  }

  const job: BackgroundJobRecord = {
    jobId: createRandomId("job"),
    kind: input.kind,
    status: "queued",
    userId: input.userId,
    dedupeKey: input.dedupeKey,
    ...(input.relatedRecordId ? { relatedRecordId: input.relatedRecordId } : {}),
    scheduledAt: input.scheduledAt,
    attempts: 0,
    maxAttempts: input.maxAttempts ?? 3,
  };
  state.backgroundJobs = [job, ...state.backgroundJobs].slice(0, 200);
  appendOperationalAuditRecord(state, {
    category: "job",
    action: "job_scheduled",
    message: `${job.kind} scheduled for ${job.userId}.`,
    createdAt: input.scheduledAt,
    userId: input.userId,
    ...(job.relatedRecordId ? { recordId: job.relatedRecordId } : {}),
    metadata: {
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
    },
  });
  return job;
}

export async function scheduleOperationalJobForUser(
  store: ApiStore,
  input: {
    userId: string;
    userState: UserState;
    kind: BackgroundJobRecord["kind"];
    dedupeKey: string;
    relatedRecordId?: string;
    scheduledAt?: string;
    maxAttempts?: number;
  },
) {
  const scheduledAt = input.scheduledAt ?? new Date().toISOString();
  const operationalState = cloneOperationalState(await store.getOperationalState());
  ensureOperationalBackfill(operationalState, scheduledAt);
  syncOperationalDomainSchemas(operationalState, {
    userId: input.userId,
    userState: input.userState,
    nowIso: scheduledAt,
  });
  const job = scheduleOperationalJob(operationalState, {
    kind: input.kind,
    userId: input.userId,
    dedupeKey: input.dedupeKey,
    scheduledAt,
    ...(input.relatedRecordId ? { relatedRecordId: input.relatedRecordId } : {}),
    ...(input.maxAttempts !== undefined ? { maxAttempts: input.maxAttempts } : {}),
  });
  await store.saveOperationalState(operationalState);
  return job;
}

export async function runOperationalJobs(
  store: ApiStore,
  input: {
    userId: string;
    kind?: BackgroundJobRecord["kind"];
    limit?: number;
    applyPaymentReconciliation: (
      order: UserState["ordersById"][string],
    ) => UserState["ordersById"][string];
    retryThreadMessage: (
      userState: UserState,
      input: { threadId: string; messageId: string },
    ) => unknown;
    appendAccountOperationRecord: (
      userState: UserState,
      input: Omit<AccountOperationRecord, "recordId" | "createdAt"> & {
        recordId?: string;
        createdAt?: string;
      },
    ) => unknown;
  },
) {
  const nowIso = new Date().toISOString();
  const userState = await store.getUserState(input.userId);
  const operationalState = cloneOperationalState(await store.getOperationalState());
  ensureOperationalBackfill(operationalState, nowIso);
  syncOperationalDomainSchemas(operationalState, {
    userId: input.userId,
    userState,
    nowIso,
  });

  const runnable = operationalState.backgroundJobs
    .filter((job) => {
      if (job.userId !== input.userId) {
        return false;
      }
      if (input.kind && job.kind !== input.kind) {
        return false;
      }
      if (!(job.status === "queued" || job.status === "failed")) {
        return false;
      }
      if (Date.parse(job.scheduledAt) > Date.now()) {
        return false;
      }
      return true;
    })
    .slice(0, input.limit ?? 20);

  for (const job of runnable) {
    job.status = "running";
    job.startedAt = nowIso;
    job.attempts += 1;

    try {
      switch (job.kind) {
        case "upload_cleanup": {
          const record = job.relatedRecordId ? userState.uploadsByTaskId[job.relatedRecordId] : undefined;
          if (!record) {
            job.status = "skipped";
            job.lastResult = "Upload record is already absent.";
            break;
          }
          if (record.cleanupRecord?.referenced || record.references.length > 0) {
            job.status = "skipped";
            job.lastResult = "Upload is still referenced and cannot be cleaned up.";
            break;
          }
          if (record.uploadTask.lifecycle.retentionStatus === "expired") {
            job.status = "skipped";
            job.lastResult = "Upload cleanup already completed.";
            break;
          }
          record.uploadTask.lifecycle.retentionStatus = "expired";
          record.uploadTask.lifecycle.canCancel = false;
          record.binaryByChunkIndex = {};
          delete record.binaryObjectKey;
          record.cleanupRecord = {
            retentionStatus: "expired",
            cleanupScheduledAt: record.cleanupRecord?.cleanupScheduledAt ?? nowIso,
            cleanupReason: record.cleanupRecord?.cleanupReason ?? "background_cleanup",
            referenced: false,
          };
          job.status = "completed";
          job.lastResult = "Upload cleanup completed.";
          break;
        }
        case "payment_reconciliation": {
          const order = job.relatedRecordId ? userState.ordersById[job.relatedRecordId] : undefined;
          if (!order) {
            job.status = "skipped";
            job.lastResult = "Order record is already absent.";
            break;
          }
          if (order.reconciliation?.status === "reconciled") {
            job.status = "skipped";
            job.lastResult = "Order is already reconciled.";
            break;
          }
          userState.ordersById[order.order.orderId] = input.applyPaymentReconciliation(order);
          job.status = "completed";
          job.lastResult = "Payment reconciliation completed.";
          break;
        }
        case "notification_retry": {
          const messageId = job.relatedRecordId;
          const targetThreadId = Object.values(userState.threadRecordsById).find((record) =>
            record.messages.some((message) => message.messageId === messageId),
          )?.thread.threadId;
          if (!messageId || !targetThreadId) {
            job.status = "skipped";
            job.lastResult = "Notification retry target is already absent.";
            break;
          }
          const retried = input.retryThreadMessage(userState, {
            threadId: targetThreadId,
            messageId,
          });
          if (!retried) {
            job.status = "skipped";
            job.lastResult = "Notification retry target is no longer retryable.";
            break;
          }
          job.status = "completed";
          job.lastResult = "Notification retry queued again.";
          break;
        }
        case "cancellation_expiry": {
          if (!userState.pendingCancellation) {
            job.status = "skipped";
            job.lastResult = "Cancellation expiry already finalized.";
            break;
          }
          userState.availabilityStatus = "frozen";
          delete userState.pendingCancellation;
          input.appendAccountOperationRecord(userState, {
            kind: "request_cancellation",
            status: "completed",
            actorLabel: "MiniX Operations",
            message: "Cancellation cooling-off window expired and the account moved into a frozen archival state.",
            notificationHookLabel: "notify:cancellation_finalized",
          });
          job.status = "completed";
          job.lastResult = "Cancellation expiry finalized.";
          break;
        }
      }
    } catch (error) {
      job.status = job.attempts >= job.maxAttempts ? "failed" : "queued";
      job.lastError = error instanceof Error ? error.message : "unknown operational job failure";
      appendOperationalMonitoringEvent(operationalState, {
        level: "error",
        scope: "job",
        message: `${job.kind} failed: ${job.lastError}`,
        createdAt: nowIso,
        jobId: job.jobId,
        userId: job.userId,
        dedupeKey: job.dedupeKey,
      });
    }

    job.completedAt = nowIso;
    appendOperationalAuditRecord(operationalState, {
      category: "job",
      action: `job_${job.status}`,
      message: `${job.kind} ${job.status}.`,
      createdAt: nowIso,
      userId: job.userId,
      ...(job.relatedRecordId ? { recordId: job.relatedRecordId } : {}),
      metadata: {
        attempts: job.attempts,
        ...(job.lastResult ? { result: job.lastResult } : {}),
      },
    });
  }

  operationalState.lastSweepAt = nowIso;
  syncOperationalDomainSchemas(operationalState, {
    userId: input.userId,
    userState,
    nowIso,
  });
  await store.saveUserState(input.userId, userState);
  await store.saveOperationalState(operationalState);

  return {
    userState,
    operationalState,
    jobs: runnable,
  };
}

export function createOperationalDiagnosticsResponse(
  userState: UserState,
  operationalState: OperationalState,
  input: {
    limit?: number;
    includeCompletedJobs?: boolean;
    providerReadiness?: unknown;
    environmentSummary?: unknown;
    evidencePack?: unknown;
  } = {},
) {
  const limit = input.limit ?? 20;
  const backgroundJobs = operationalState.backgroundJobs
    .filter((job) => input.includeCompletedJobs || (job.status !== "completed" && job.status !== "skipped"))
    .slice(0, limit);
  return {
    schemaVersion: operationalState.schemaVersion,
    ...(operationalState.lastSweepAt ? { lastSweepAt: operationalState.lastSweepAt } : {}),
    domainSchemas: operationalState.domainSchemas,
    migrations: operationalState.migrations.slice(0, limit),
    backgroundJobs,
    monitoringEvents: operationalState.monitoringEvents.slice(0, limit),
    auditTrail: operationalState.auditTrail.slice(0, limit),
    ...(input.providerReadiness ? { providerReadiness: input.providerReadiness } : {}),
    ...(input.environmentSummary ? { environmentSummary: input.environmentSummary } : {}),
    ...(input.evidencePack ? { evidencePack: input.evidencePack } : {}),
    governance: {
      queuedJobs: operationalState.backgroundJobs.filter((job) => job.status === "queued").length,
      failedJobs: operationalState.backgroundJobs.filter((job) => job.status === "failed").length,
      retryableNotifications: countFailedNotificationRetries(userState),
      appliedMigrations: operationalState.migrations.filter((migration) => migration.status === "completed").length,
    },
  };
}
