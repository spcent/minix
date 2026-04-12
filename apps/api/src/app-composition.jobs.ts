import { appendAccountOperationRecord } from "./domains/account/operations";
import { retryThreadMessage } from "./domains/messages/threads";
import {
  runOperationalJobs as runOperationalJobsImpl,
  scheduleOperationalJobForUser,
} from "./domains/ops/jobs";
import { applyPaymentReconciliation } from "./domains/payment/ledger";
import type { ApiStore, UserState } from "./types";

interface ScheduledJobInputBase {
  store: ApiStore;
  userId: string;
  userState: UserState;
}

export function createApiJobWiring() {
  return {
    schedulePaymentReconciliation: async (input: ScheduledJobInputBase & {
      orderId: string;
    }) => {
      await scheduleOperationalJobForUser(input.store, {
        userId: input.userId,
        userState: input.userState,
        kind: "payment_reconciliation",
        dedupeKey: `payment_reconciliation:${input.orderId}`,
        relatedRecordId: input.orderId,
      });
    },
    scheduleUploadCleanup: async (input: ScheduledJobInputBase & {
      taskId: string;
      scheduledAt?: string;
    }) => {
      await scheduleOperationalJobForUser(input.store, {
        userId: input.userId,
        userState: input.userState,
        kind: "upload_cleanup",
        dedupeKey: `upload_cleanup:${input.taskId}`,
        relatedRecordId: input.taskId,
        ...(input.scheduledAt ? { scheduledAt: input.scheduledAt } : {}),
      });
    },
    scheduleMessageRetry: async (input: ScheduledJobInputBase & {
      messageId: string;
    }) => {
      await scheduleOperationalJobForUser(input.store, {
        userId: input.userId,
        userState: input.userState,
        kind: "notification_retry",
        dedupeKey: `message_retry:${input.messageId}`,
        relatedRecordId: input.messageId,
      });
    },
    runOperationalJobs: async (
      store: ApiStore,
      input: {
        userId: string;
        kind?: "upload_cleanup" | "payment_reconciliation" | "notification_retry" | "cancellation_expiry";
        limit?: number;
      },
    ) =>
      runOperationalJobsImpl(store, {
        ...input,
        applyPaymentReconciliation,
        retryThreadMessage,
        appendAccountOperationRecord,
      }),
    scheduleOperationalJobForUser: (store: ApiStore, input: Parameters<typeof scheduleOperationalJobForUser>[1]) =>
      scheduleOperationalJobForUser(store, input),
  };
}

export type ApiJobWiring = ReturnType<typeof createApiJobWiring>;
