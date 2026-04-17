import test from "node:test";
import assert from "node:assert/strict";

import { ok, type AppKernel } from "@minix/core";
import {
  APP_ROUTE_IDS,
  type FeedbackBootstrapResponse,
  type FeedbackTicketActionResponse,
  type FeedbackTicketDetailResponse,
  type ListFeedbackTicketsResponse,
} from "@minix/contracts";

import { createFeedbackController } from "./index";
import { createDefaultFeedbackState } from "../model";

function createKernelStub() {
  const routeCalls: Array<{ routeId: string; params?: Record<string, string | number | boolean> }> = [];
  const storageValues = new Map<string, unknown>();
  let requestMode: "success" | "unauthorized" = "success";
  const uploadTransfer = {
    mode: "chunked" as const,
    checksumAlgorithm: "sha256" as const,
    fileChecksum: "feedback_checksum_file",
    totalBytes: 245760,
    chunkSizeBytes: 122880,
    chunks: [
      {
        chunkIndex: 0,
        byteOffset: 0,
        byteLength: 122880,
        checksum: "feedback_checksum_chunk_0",
        checksumAlgorithm: "sha256" as const,
        dataBase64: "ZmVlZGJhY2stY2h1bmstMA==",
      },
      {
        chunkIndex: 1,
        byteOffset: 122880,
        byteLength: 122880,
        checksum: "feedback_checksum_chunk_1",
        checksumAlgorithm: "sha256" as const,
        dataBase64: "ZmVlZGJhY2stY2h1bmstMQ==",
      },
    ],
  };

  const kernel = {
    env: {
      appId: "host-h5",
      appName: "Host H5",
      apiBaseUrl: "https://mock.minix.local",
      debug: true,
      platform: "h5",
      version: "1.0.0",
    },
    capability: {
      status(capability: string) {
        const available = capability === "device" || capability === "upload";
        return ok({
          capability: capability as "device" | "upload",
          available,
          mode: available ? "native" : "unavailable",
          detail: available ? `${capability} capability is available.` : `${capability} capability is unavailable.`,
        });
      },
      async execute(input?: { capability?: string }) {
        if (input?.capability === "upload") {
          return ok({
            capability: "upload",
            action: "selectAsset",
            value: {
              uploadTask: {
                taskId: "task_feedback_1",
                scenario: "content",
                fileType: "image",
                stage: "completed",
                fileName: "feedback-screenshot.png",
                progress: {
                  completedBytes: 245760,
                  totalBytes: 245760,
                  percentage: 100,
                },
                chunkingReserved: false,
                governance: {
                  maxSizeBytes: 10_000_000,
                  acceptedFileTypes: ["image"],
                  sensitiveReviewRequired: true,
                  expiresInDays: 30,
                },
                reviewStatus: "not_required",
                lifecycle: {
                  backendBacked: false,
                  retentionStatus: "active",
                  retryCount: 0,
                  canRetry: true,
                  canCancel: false,
                },
              },
              uploadAsset: {
                assetId: "asset_selection_1",
                fileType: "image",
                fileName: "feedback-screenshot.png",
                url: "https://example.test/local/feedback-screenshot.png",
                metadata: {
                  sizeBytes: 245760,
                  width: 1440,
                  height: 900,
                },
              },
              transfer: uploadTransfer,
            },
          });
        }

        return ok({
          capability: "device",
          action: "getInfo",
          value: {
            userAgent: "MiniX Test Browser",
            language: "en-US",
          },
        });
      },
    },
    session: {
      async get() {
        return ok({
          identity: { userId: "feedback-user" },
          loggedIn: true,
          platform: "h5",
          token: { accessToken: "token_1" },
        });
      },
    },
    storage: {
      async get<T>(key: string) {
        return ok((storageValues.get(key) as T | undefined) ?? null);
      },
      async set<T>(key: string, value: T) {
        storageValues.set(key, value);
        return ok(undefined);
      },
      async remove(key: string) {
        storageValues.delete(key);
        return ok(undefined);
      },
      async clear() {
        storageValues.clear();
        return ok(undefined);
      },
    },
    request: {
      async get<T>(path: string) {
        if (requestMode === "unauthorized") {
          return {
            ok: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Feedback session expired",
              recoverable: true,
            },
          } as const;
        }

        if (path === "/feedback/bootstrap") {
          const response: FeedbackBootstrapResponse = {
            feedbackCategories: [
              {
                key: "product_issue",
                label: "Product Issue",
                type: "issue_report",
                defaultPriority: "high",
                labels: ["product", "bug"],
                supportsAttachments: true,
                faqEntries: [
                  {
                    entryId: "faq_account_recovery",
                    title: "Account Recovery FAQ",
                    summary: "Use the shared account recovery lane first.",
                  },
                ],
                customerServiceEntryLabel: "Open Support Desk",
                supportEntry: {
                  entryId: "support_feedback",
                  label: "Open Support Desk",
                  summary: "Continue follow-up in the inbox support thread.",
                  channel: "messages",
                  routeId: APP_ROUTE_IDS.messages,
                  threadId: "thread_customer_service",
                },
              },
              {
                key: "improvement",
                label: "Suggestion",
                type: "suggestion",
                defaultPriority: "medium",
                labels: ["idea"],
                supportsAttachments: true,
              },
            ],
            recommendedFaqEntries: [
              {
                entryId: "faq_account_recovery",
                title: "Account Recovery FAQ",
                summary: "Use the shared account recovery lane first.",
              },
            ],
            faqCatalog: [
              {
                entryId: "faq_account_recovery",
                title: "Account Recovery FAQ",
                summary: "Use the shared account recovery lane first.",
                categoryKeys: ["product_issue"],
                enabled: true,
                updatedAt: "2026-04-08T10:00:00.000Z",
              },
            ],
            supportEntries: [
              {
                entryId: "support_feedback",
                label: "Open Support Desk",
                summary: "Continue follow-up in the inbox support thread.",
                channel: "messages",
                routeId: APP_ROUTE_IDS.messages,
                threadId: "thread_customer_service",
                queueKey: "product_support",
                queueLabel: "Product Support",
                handlerLabel: "Support Desk",
                enabled: true,
                updatedAt: "2026-04-08T10:00:00.000Z",
              },
            ],
            supportEntry: {
              entryId: "support_feedback",
              label: "Open Support Desk",
              summary: "Continue follow-up in the inbox support thread.",
              channel: "messages",
              routeId: APP_ROUTE_IDS.messages,
              threadId: "thread_customer_service",
            },
            serviceLoopSummary: "Use the support entry if you need to add more context.",
            ticketList: {
              items: [],
              page: 1,
              pageSize: 10,
              total: 0,
              hasMore: false,
            },
          };
          return ok(response as T);
        }

        if (path === "/feedback/tickets") {
          const response: ListFeedbackTicketsResponse = {
            ticketList: {
              items: [
                {
                  ticketId: "fb_1",
                  title: "Login button missing",
                  categoryKey: "product_issue",
                  categoryLabel: "Product Issue",
                  type: "issue_report",
                  state: "submitted",
                  priority: "high",
                  labels: ["product", "bug"],
                  revisitRequired: true,
                  queueKey: "product_support",
                  queueLabel: "Product Support",
                  assignee: {
                    userId: "support_agent_1",
                    label: "Support Desk",
                    teamLabel: "Product Support",
                    assignedAt: "2026-04-08T10:00:00.000Z",
                  },
                  sla: {
                    policyKey: "product_issue_default_sla",
                    label: "24 hour response",
                    deadlineAt: "2026-04-09T10:00:00.000Z",
                    breached: false,
                    updatedAt: "2026-04-08T10:00:00.000Z",
                  },
                  supportThreadId: "thread_customer_service",
                  lastUpdatedAt: "2026-04-08T10:00:00.000Z",
                },
              ],
              page: 1,
              pageSize: 10,
              total: 1,
              hasMore: false,
              selectedTicketId: "fb_1",
            },
            faqCatalog: [
              {
                entryId: "faq_account_recovery",
                title: "Account Recovery FAQ",
                summary: "Use the shared account recovery lane first.",
                categoryKeys: ["product_issue"],
                enabled: true,
                updatedAt: "2026-04-08T10:00:00.000Z",
              },
            ],
            supportEntries: [
              {
                entryId: "support_feedback",
                label: "Open Support Desk",
                summary: "Continue follow-up in the inbox support thread.",
                channel: "messages",
                routeId: APP_ROUTE_IDS.messages,
                threadId: "thread_customer_service",
                queueKey: "product_support",
                queueLabel: "Product Support",
                handlerLabel: "Support Desk",
                enabled: true,
                updatedAt: "2026-04-08T10:00:00.000Z",
              },
            ],
          };
          return ok(response as T);
        }

        const response: FeedbackTicketDetailResponse = {
          feedbackTicket: {
            ticketId: "fb_1",
            type: "issue_report",
            categoryKey: "product_issue",
            title: "Login button missing",
            description: "The primary login button did not render.",
            priority: "high",
            labels: ["product", "bug"],
            revisitRequested: true,
            queueKey: "product_support",
            queueLabel: "Product Support",
            assignee: {
              userId: "support_agent_1",
              label: "Support Desk",
              teamLabel: "Product Support",
              assignedAt: "2026-04-08T10:00:00.000Z",
            },
            sla: {
              policyKey: "product_issue_default_sla",
              label: "24 hour response",
              deadlineAt: "2026-04-09T10:00:00.000Z",
              breached: false,
              updatedAt: "2026-04-08T10:00:00.000Z",
            },
            supportThreadId: "thread_customer_service",
            createdAt: "2026-04-08T10:00:00.000Z",
            updatedAt: "2026-04-08T10:00:00.000Z",
            context: {
              sourcePage: "/feedback",
              userId: "feedback-user",
              platform: "h5",
              appVersion: "1.0.0",
              screenshotAssets: [],
              attachmentAssets: [],
            },
          },
          feedbackCategory: {
            key: "product_issue",
            label: "Product Issue",
            type: "issue_report",
            defaultPriority: "high",
            labels: ["product", "bug"],
            supportsAttachments: true,
            customerServiceEntryLabel: "Open Support Desk",
          },
          feedbackStatus: {
            state: "submitted",
            label: "Submitted",
            progressLabel: "Queued for initial review",
            revisitRequired: true,
            nextStepLabel: "Use the support entry if you need to add more context.",
            faqEntries: [
              {
                entryId: "faq_account_recovery",
                title: "Account Recovery FAQ",
                summary: "Use the shared account recovery lane first.",
              },
            ],
            supportEntry: {
              entryId: "support_feedback",
              label: "Open Support Desk",
              summary: "Continue follow-up in the inbox support thread.",
              channel: "messages",
              routeId: APP_ROUTE_IDS.messages,
              threadId: "thread_customer_service",
            },
            queueKey: "product_support",
            queueLabel: "Product Support",
            assignee: {
              userId: "support_agent_1",
              label: "Support Desk",
              teamLabel: "Product Support",
              assignedAt: "2026-04-08T10:00:00.000Z",
            },
            sla: {
              policyKey: "product_issue_default_sla",
              label: "24 hour response",
              deadlineAt: "2026-04-09T10:00:00.000Z",
              breached: false,
              updatedAt: "2026-04-08T10:00:00.000Z",
            },
            revisitAction: {
              ticketId: "fb_1",
              label: "Add More Context",
              summary: "Continue follow-up in the support lane.",
              enabled: true,
              routeId: APP_ROUTE_IDS.messages,
              threadId: "thread_customer_service",
            },
            handlingProgress: ["Submitted", "Triaged"],
            processingHistory: [
              {
                recordedAt: "2026-04-08T10:00:00.000Z",
                actorLabel: "System Intake",
                actionLabel: "Ticket created",
                state: "submitted",
              },
            ],
          },
        };
        return ok(response as T);
      },
      async post<T>(_path: string, payload?: unknown) {
      if (_path === "/uploads/session") {
        return ok({
            source: "backend_session",
            uploadTask: {
              taskId: "task_feedback_1",
              scenario: "content",
              fileType: "image",
              stage: "uploading",
              fileName: "feedback-screenshot.png",
              progress: {
                completedBytes: 0,
                totalBytes: 245760,
                percentage: 0,
              },
              chunkingReserved: false,
              transferMode: "chunked",
              sessionId: "feedback_session_1",
              chunkCount: 2,
              uploadedChunkCount: 0,
              integrity: {
                checksumAlgorithm: "sha256",
                fileChecksum: uploadTransfer.fileChecksum,
                expectedSizeBytes: 245760,
              },
              governance: {
                maxSizeBytes: 10_000_000,
                acceptedFileTypes: ["image"],
                sensitiveReviewRequired: true,
                expiresInDays: 30,
              },
              reviewStatus: "not_required",
              reviewMessage: "Upload session created. Transfer chunks to continue.",
              lifecycle: {
                backendBacked: true,
                retentionStatus: "active",
                retryCount: 0,
                canRetry: false,
                canCancel: true,
                lastTransitionAt: "2026-04-08T10:00:00.000Z",
                expiresAt: "2026-05-08T10:00:00.000Z",
              },
            },
            uploadAsset: {
              assetId: "asset_uploaded_1",
              fileType: "image",
              fileName: "feedback-screenshot.png",
              url: "https://example.test/uploads/asset_uploaded_1",
              thumbnailUrl: "https://example.test/uploads/asset_uploaded_1/thumb",
              metadata: {
                sizeBytes: 245760,
                width: 1440,
                height: 900,
              },
            },
            transfer: uploadTransfer,
            session: {
              sessionId: "feedback_session_1",
              uploadToken: "feedback_upload_token_1",
              objectKey: "object/asset_uploaded_1/feedback_session_1",
              mode: "chunked",
              checksumAlgorithm: "sha256",
              chunkSizeBytes: 122880,
              chunkCount: 2,
              receivedChunkCount: 0,
              nextChunkIndex: 0,
              resumeSupported: true,
              createdAt: "2026-04-08T10:00:00.000Z",
              expiresAt: "2026-04-08T11:00:00.000Z",
            },
        } as T);
      }

      if (_path === "/uploads/chunk") {
        const chunkIndex = Number(((payload as { chunk?: { chunkIndex?: number } })?.chunk?.chunkIndex) ?? 0);
        return ok({
          source: "backend_chunk",
          uploadTask: {
            taskId: "task_feedback_1",
            scenario: "content",
            fileType: "image",
            stage: "uploading",
            fileName: "feedback-screenshot.png",
            progress: {
              completedBytes: chunkIndex === 0 ? 122880 : 245760,
              totalBytes: 245760,
              percentage: chunkIndex === 0 ? 50 : 100,
            },
            chunkingReserved: false,
            transferMode: "chunked",
            sessionId: "feedback_session_1",
            chunkCount: 2,
            uploadedChunkCount: chunkIndex + 1,
            integrity: {
              checksumAlgorithm: "sha256",
              fileChecksum: uploadTransfer.fileChecksum,
              expectedSizeBytes: 245760,
            },
            governance: {
              maxSizeBytes: 10_000_000,
              acceptedFileTypes: ["image"],
              sensitiveReviewRequired: true,
              expiresInDays: 30,
            },
            reviewStatus: "not_required",
            reviewMessage: `Chunk ${chunkIndex + 1} uploaded.`,
            lifecycle: {
              backendBacked: true,
              retentionStatus: "active",
              retryCount: 0,
              canRetry: false,
              canCancel: true,
              lastTransitionAt: "2026-04-08T10:02:00.000Z",
              expiresAt: "2026-05-08T10:00:00.000Z",
            },
          },
          uploadAsset: {
            assetId: "asset_uploaded_1",
            fileType: "image",
            fileName: "feedback-screenshot.png",
            url: "https://example.test/uploads/asset_uploaded_1",
            thumbnailUrl: "https://example.test/uploads/asset_uploaded_1/thumb",
            metadata: {
              sizeBytes: 245760,
              width: 1440,
              height: 900,
            },
          },
          transfer: uploadTransfer,
          session: {
            sessionId: "feedback_session_1",
            uploadToken: "feedback_upload_token_1",
            objectKey: "object/asset_uploaded_1/feedback_session_1",
            mode: "chunked",
            checksumAlgorithm: "sha256",
            chunkSizeBytes: 122880,
            chunkCount: 2,
            receivedChunkCount: chunkIndex + 1,
            nextChunkIndex: chunkIndex + 1,
            resumeSupported: true,
            createdAt: "2026-04-08T10:00:00.000Z",
            expiresAt: "2026-04-08T11:00:00.000Z",
          },
        } as T);
      }

      if (_path === "/uploads/complete") {
        return ok({
          source: "backend_complete",
          uploadTask: {
            taskId: "task_feedback_1",
            scenario: "content",
            fileType: "image",
            stage: "reviewing",
            fileName: "feedback-screenshot.png",
            progress: {
              completedBytes: 245760,
              totalBytes: 245760,
              percentage: 100,
            },
            chunkingReserved: false,
            transferMode: "chunked",
            sessionId: "feedback_session_1",
            chunkCount: 2,
            uploadedChunkCount: 2,
            integrity: {
              checksumAlgorithm: "sha256",
              fileChecksum: uploadTransfer.fileChecksum,
              expectedSizeBytes: 245760,
            },
            governance: {
              maxSizeBytes: 10_000_000,
              acceptedFileTypes: ["image"],
              sensitiveReviewRequired: true,
              expiresInDays: 30,
            },
            reviewStatus: "pending",
            reviewMessage: "Sensitive review is pending in the upload pipeline.",
            lifecycle: {
              backendBacked: true,
              retentionStatus: "active",
              retryCount: 0,
              canRetry: false,
              canCancel: true,
              lastTransitionAt: "2026-04-08T10:03:00.000Z",
              expiresAt: "2026-05-08T10:00:00.000Z",
            },
          },
          uploadAsset: {
            assetId: "asset_uploaded_1",
            fileType: "image",
            fileName: "feedback-screenshot.png",
            url: "https://example.test/uploads/asset_uploaded_1",
            thumbnailUrl: "https://example.test/uploads/asset_uploaded_1/thumb",
            metadata: {
              sizeBytes: 245760,
              width: 1440,
              height: 900,
              checksum: uploadTransfer.fileChecksum,
              checksumAlgorithm: "sha256",
            },
          },
        } as T);
      }

      if (_path === "/feedback/ticket/revisit") {
        const request = payload as {
          ticketId: string;
          userMessage?: string;
        };
        return ok({
          feedbackTicket: {
            ticketId: request.ticketId,
            type: "issue_report",
            categoryKey: "product_issue",
            title: "Login button missing",
            description: "The primary login button did not render.",
            priority: "high",
            labels: ["product", "bug"],
            revisitRequested: true,
            queueKey: "product_support",
            queueLabel: "Product Support",
            assignee: {
              userId: "support_agent_1",
              label: "Support Desk",
              teamLabel: "Product Support",
              assignedAt: "2026-04-08T10:00:00.000Z",
            },
            supportThreadId: "thread_customer_service",
            createdAt: "2026-04-08T10:00:00.000Z",
            updatedAt: "2026-04-08T11:00:00.000Z",
            context: {
              sourcePage: "/feedback",
              userId: "feedback-user",
              platform: "h5",
              appVersion: "1.0.0",
              screenshotAssets: [],
              attachmentAssets: [],
            },
          },
          feedbackCategory: {
            key: "product_issue",
            label: "Product Issue",
            type: "issue_report",
            defaultPriority: "high",
            labels: ["product", "bug"],
            supportsAttachments: true,
            customerServiceEntryLabel: "Open Support Desk",
            supportEntry: {
              entryId: "support_feedback",
              label: "Open Support Desk",
              summary: "Continue follow-up in the inbox support thread.",
              channel: "messages",
              routeId: APP_ROUTE_IDS.messages,
              threadId: "thread_customer_service",
            },
          },
          feedbackStatus: {
            state: "in_progress",
            label: "In Progress",
            progressLabel: "Being processed by support",
            revisitRequired: true,
            nextStepLabel: "Reply from the support entry to continue this ticket.",
            supportEntry: {
              entryId: "support_feedback",
              label: "Open Support Desk",
              summary: "Continue follow-up in the inbox support thread.",
              channel: "messages",
              routeId: APP_ROUTE_IDS.messages,
              threadId: "thread_customer_service",
            },
            queueKey: "product_support",
            queueLabel: "Product Support",
            assignee: {
              userId: "support_agent_1",
              label: "Support Desk",
              teamLabel: "Product Support",
              assignedAt: "2026-04-08T10:00:00.000Z",
            },
            revisitAction: {
              ticketId: request.ticketId,
              label: "Add More Context",
              summary: request.userMessage ?? "Continue follow-up in the support lane.",
              enabled: true,
              routeId: APP_ROUTE_IDS.messages,
              threadId: "thread_customer_service",
            },
            handlingProgress: ["Submitted", "Triaged", "Processed"],
            processingHistory: [
              {
                recordedAt: "2026-04-08T10:00:00.000Z",
                actorLabel: "System Intake",
                actionLabel: "Ticket created",
                state: "submitted",
              },
              {
                recordedAt: "2026-04-08T11:00:00.000Z",
                actorLabel: "User Follow-up",
                actionLabel: "Revisit requested with context",
                note: request.userMessage,
                state: "in_progress",
              },
            ],
          },
        } as T);
      }

      if (_path === "/feedback/ticket/action") {
        const request = payload as {
          ticketId: string;
          state?: string;
          supportReply?: string;
        };
        const response: FeedbackTicketActionResponse = {
          feedbackTicket: {
            ticketId: request.ticketId,
            type: "issue_report",
            categoryKey: "product_issue",
            title: "Login button missing",
            description: "The primary login button did not render.",
            priority: "urgent",
            labels: ["product", "bug", "route-guard"],
            revisitRequested: true,
            queueKey: "product_support",
            queueLabel: "Product Support",
            assignee: {
              userId: "support_agent_2",
              label: "Case Owner",
              teamLabel: "Product Support",
              assignedAt: "2026-04-08T11:30:00.000Z",
            },
            sla: {
              policyKey: "product_issue_default_sla",
              label: "4 hour response",
              deadlineAt: "2026-04-08T15:30:00.000Z",
              breached: false,
              updatedAt: "2026-04-08T11:30:00.000Z",
            },
            supportThreadId: "thread_customer_service",
            createdAt: "2026-04-08T10:00:00.000Z",
            updatedAt: "2026-04-08T11:30:00.000Z",
            context: {
              sourcePage: "/feedback",
              userId: "feedback-user",
              platform: "h5",
              appVersion: "1.0.0",
              screenshotAssets: [],
              attachmentAssets: [],
            },
          },
          feedbackCategory: {
            key: "product_issue",
            label: "Product Issue",
            type: "issue_report",
            defaultPriority: "high",
            labels: ["product", "bug"],
            supportsAttachments: true,
            customerServiceEntryLabel: "Open Support Desk",
          },
          feedbackStatus: {
            state: (request.state as "resolved") ?? "resolved",
            label: "Resolved",
            progressLabel: "Handled and ready for confirmation",
            revisitRequired: true,
            nextStepLabel: "Confirm whether the proposed resolution is sufficient.",
            supportEntry: {
              entryId: "support_feedback",
              label: "Open Support Desk",
              summary: "Continue follow-up in the inbox support thread.",
              channel: "messages",
              routeId: APP_ROUTE_IDS.messages,
              threadId: "thread_customer_service",
            },
            queueKey: "product_support",
            queueLabel: "Product Support",
            assignee: {
              userId: "support_agent_2",
              label: "Case Owner",
              teamLabel: "Product Support",
              assignedAt: "2026-04-08T11:30:00.000Z",
            },
            sla: {
              policyKey: "product_issue_default_sla",
              label: "4 hour response",
              deadlineAt: "2026-04-08T15:30:00.000Z",
              breached: false,
              updatedAt: "2026-04-08T11:30:00.000Z",
            },
            revisitAction: {
              ticketId: request.ticketId,
              label: "Request Follow-up",
              summary: request.supportReply ?? "Resolution sent to the support thread.",
              enabled: true,
              routeId: APP_ROUTE_IDS.messages,
              threadId: "thread_customer_service",
            },
            handlingProgress: ["Submitted", "Triaged", "Processed", "Resolved"],
            processingHistory: [
              {
                recordedAt: "2026-04-08T11:30:00.000Z",
                actorLabel: "Case Owner",
                actorRole: "support",
                state: "resolved",
                actionLabel: "Ticket moved to resolved",
                ...(request.supportReply ? { note: request.supportReply } : {}),
              },
            ],
          },
          ticketList: {
            items: [
              {
                ticketId: request.ticketId,
                title: "Login button missing",
                categoryKey: "product_issue",
                categoryLabel: "Product Issue",
                type: "issue_report",
                state: (request.state as "resolved") ?? "resolved",
                priority: "urgent",
                labels: ["product", "bug", "route-guard"],
                revisitRequired: true,
                queueKey: "product_support",
                queueLabel: "Product Support",
                assignee: {
                  userId: "support_agent_2",
                  label: "Case Owner",
                  teamLabel: "Product Support",
                  assignedAt: "2026-04-08T11:30:00.000Z",
                },
                sla: {
                  policyKey: "product_issue_default_sla",
                  label: "4 hour response",
                  deadlineAt: "2026-04-08T15:30:00.000Z",
                  breached: false,
                  updatedAt: "2026-04-08T11:30:00.000Z",
                },
                supportThreadId: "thread_customer_service",
                lastUpdatedAt: "2026-04-08T11:30:00.000Z",
              },
            ],
            page: 1,
            pageSize: 10,
            total: 1,
            hasMore: false,
            selectedTicketId: request.ticketId,
          },
        };
        return ok(response as T);
      }

      const request = payload as {
        title: string;
        description: string;
        revisitRequested?: boolean;
        context: {
          sourceContext?: Record<string, unknown>;
          actorContext?: Record<string, unknown>;
          screenshotAssets: unknown[];
        };
      };
      const response: FeedbackTicketDetailResponse = {
          feedbackTicket: {
            ticketId: "fb_1",
            type: "issue_report",
            categoryKey: "product_issue",
            title: request.title,
            description: request.description,
            priority: "high",
            labels: ["product", "bug"],
            revisitRequested: Boolean(request.revisitRequested),
            createdAt: "2026-04-08T10:00:00.000Z",
            updatedAt: "2026-04-08T10:00:00.000Z",
            context: {
              sourcePage: "/feedback",
              userId: "feedback-user",
              platform: "h5",
              appVersion: "1.0.0",
              ...(request.context.sourceContext ? { sourceContext: request.context.sourceContext as never } : {}),
              ...(request.context.actorContext ? { actorContext: request.context.actorContext as never } : {}),
              screenshotAssets: request.context.screenshotAssets as [],
              attachmentAssets: [],
            },
          },
          feedbackCategory: {
            key: "product_issue",
            label: "Product Issue",
            type: "issue_report",
            defaultPriority: "high",
            labels: ["product", "bug"],
            supportsAttachments: true,
            customerServiceEntryLabel: "Open Support Desk",
          },
          feedbackStatus: {
            state: "submitted",
            label: "Submitted",
            progressLabel: "Queued for initial review",
            revisitRequired: Boolean(request.revisitRequested),
            nextStepLabel: "Use the support entry if you need to add more context.",
            supportEntry: {
              entryId: "support_feedback",
              label: "Open Support Desk",
              summary: "Continue follow-up in the inbox support thread.",
              channel: "messages",
              routeId: APP_ROUTE_IDS.messages,
              threadId: "thread_customer_service",
            },
            revisitAction: {
              ticketId: "fb_1",
              label: "Add More Context",
              summary: "Continue follow-up in the support lane.",
              enabled: true,
              routeId: APP_ROUTE_IDS.messages,
              threadId: "thread_customer_service",
            },
            handlingProgress: ["Submitted", "Triaged"],
            processingHistory: [
              {
                recordedAt: "2026-04-08T10:00:00.000Z",
                actorLabel: "System Intake",
                actionLabel: "Ticket created",
                state: "submitted",
              },
            ],
          },
        };
        return ok(response as T);
      },
    },
    router: {
      async toRoute(routeId: string, params?: Record<string, string | number | boolean>) {
        routeCalls.push({ routeId, ...(params ? { params } : {}) });
        return ok(undefined);
      },
      async replaceRoute(routeId: string, params?: Record<string, string | number | boolean>) {
        routeCalls.push({ routeId, ...(params ? { params } : {}) });
        return ok(undefined);
      },
      current() {
        return ok({ path: "/feedback" });
      },
    },
  } as unknown as AppKernel;

  return {
    kernel,
    routeCalls,
    storageValues,
    setRequestMode(mode: "success" | "unauthorized") {
      requestMode = mode;
    },
  };
}

test("feedback controller loads bootstrap data and captures local context", async () => {
  const { kernel } = createKernelStub();
  const controller = createFeedbackController({
    kernel,
    feedbackRouteId: APP_ROUTE_IDS.feedback,
    initialState: createDefaultFeedbackState(),
  });

  await controller.loadInitial();

  assert.equal(controller.store.getState().ready, true);
  assert.equal(controller.store.getState().categories.length, 2);
  assert.equal(controller.store.getState().values.userId, "feedback-user");
  assert.equal(controller.store.getState().formValues.userId, "feedback-user");
  assert.equal(controller.store.getState().values.sourceRouteId, APP_ROUTE_IDS.feedback);
  assert.match(controller.store.getState().values.deviceSummary ?? "", /userAgent/);
  assert.equal(controller.store.getState().recommendedFaqEntries.length, 1);
  assert.equal(controller.store.getState().supportEntry?.threadId, "thread_customer_service");
});

test("feedback controller drives schema, draft recovery, and approval nodes from the shared form platform", async () => {
  const { kernel, storageValues } = createKernelStub();
  const controller = createFeedbackController({
    kernel,
    initialState: createDefaultFeedbackState(),
  });

  await controller.loadInitial();
  controller.setStep("attachments");
  controller.updateValues({
    title: "Broken payment receipt",
    description: "Resolved quickly.",
  });
  controller.toggleRevisitRequested();
  await controller.saveDraft();

  const restoredController = createFeedbackController({
    kernel,
    initialState: createDefaultFeedbackState(),
  });
  await restoredController.loadInitial();

  assert.equal(storageValues.has("@minix/feedback/form-draft/v1"), true);
  assert.equal(restoredController.store.getState().values.title, "Broken payment receipt");
  assert.equal(restoredController.store.getState().workflow.currentStepKey, "attachments");
  assert.equal(restoredController.store.getState().workflow.conditionalFieldKeys.includes("attachmentAssets"), true);
  assert.equal(restoredController.store.getState().schema.fields.some((field) => field.type === "rich_text"), true);
  assert.equal(restoredController.store.getState().schema.fields.some((field) => field.type === "upload_reference"), true);
  assert.equal(restoredController.store.getState().workflow.approvalNodes?.[0]?.assigneeLabel, "Support Desk");
});

test("feedback controller validates required fields before submit", async () => {
  const { kernel } = createKernelStub();
  const controller = createFeedbackController({
    kernel,
    initialState: createDefaultFeedbackState(),
  });

  controller.validateForm();

  assert.equal(controller.store.getState().fieldErrors.length > 0, true);
  assert.equal(controller.store.getState().validationErrors.length > 0, true);
  assert.equal(controller.store.getState().submitState.phase, "failed");
});

test("feedback controller uploads screenshot assets through the shared pipeline before submit", async () => {
  const { kernel } = createKernelStub();
  const controller = createFeedbackController({
    kernel,
    initialState: createDefaultFeedbackState(),
  });

  await controller.loadInitial();
  controller.updateValues({
    title: "Broken login button",
    description: "The primary login button failed to render after refresh.",
  });
  await controller.addSampleScreenshot();
  controller.toggleRevisitRequested();
  const result = await controller.submit();

  assert.equal(result.ok, true);
  assert.equal(controller.store.getState().latestTicket?.ticketId, "fb_1");
  assert.equal(controller.store.getState().values.screenshotAssets.length, 1);
  assert.equal(controller.store.getState().formValues.screenshotAssets.length, 1);
  assert.equal(controller.store.getState().values.screenshotAssets[0]?.assetId, "asset_uploaded_1");
  assert.equal(controller.store.getState().latestStatus?.revisitRequired, true);
  assert.equal(controller.store.getState().lastSubmission?.value?.feedbackCategory.key, "product_issue");
  assert.equal(controller.store.getState().latestTicket?.context.sourceContext?.pagePath, "/feedback");
  assert.equal(controller.store.getState().latestTicket?.context.actorContext?.userId, "feedback-user");
  assert.equal(controller.store.getState().submitState.phase, "submitted");
  assert.equal(controller.store.getState().submitState.mode, "submit");
});

test("feedback controller can route into the bounded support entry", async () => {
  const { kernel, routeCalls } = createKernelStub();
  const controller = createFeedbackController({
    kernel,
    messagesRouteId: APP_ROUTE_IDS.messages,
    initialState: createDefaultFeedbackState(),
  });

  await controller.loadInitial();
  await controller.openSupportEntry();

  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.messages,
    params: {
      threadId: "thread_customer_service",
    },
  });
});

test("feedback controller can refresh the latest ticket status", async () => {
  const { kernel } = createKernelStub();
  const controller = createFeedbackController({
    kernel,
    initialState: createDefaultFeedbackState(),
  });

  await controller.loadInitial();
  controller.updateValues({
    title: "Broken login button",
    description: "The primary login button failed to render after refresh.",
  });
  await controller.submit();
  await controller.refreshLatestStatus();

  assert.equal(controller.store.getState().latestStatus?.state, "submitted");
});

test("feedback controller loads ticket list and can open a selected ticket", async () => {
  const { kernel } = createKernelStub();
  const controller = createFeedbackController({
    kernel,
    initialState: createDefaultFeedbackState(),
  });

  await controller.loadInitial();
  await controller.loadTickets();
  await controller.openTicket("fb_1");

  assert.equal(controller.store.getState().ticketList?.items.length, 1);
  assert.equal(controller.store.getState().selectedTicketId, "fb_1");
  assert.equal(controller.store.getState().faqCatalog[0]?.entryId, "faq_account_recovery");
  assert.equal(controller.store.getState().latestTicket?.ticketId, "fb_1");
});

test("feedback controller can request a ticket revisit and keep support-loop state aligned", async () => {
  const { kernel } = createKernelStub();
  const controller = createFeedbackController({
    kernel,
    initialState: createDefaultFeedbackState(),
  });

  await controller.loadInitial();
  controller.updateValues({
    title: "Broken login button",
    description: "The primary login button failed to render after refresh.",
  });
  await controller.submit();
  await controller.revisitLatestTicket("Please re-check the rendering after cache clear.");

  assert.equal(controller.store.getState().latestStatus?.state, "in_progress");
  assert.equal(controller.store.getState().latestStatus?.processingHistory.length, 2);
  assert.equal(controller.store.getState().serviceLoopSummary, "Reply from the support entry to continue this ticket.");
});

test("feedback controller can apply support operator actions and keep queue state aligned", async () => {
  const { kernel } = createKernelStub();
  const controller = createFeedbackController({
    kernel,
    initialState: createDefaultFeedbackState(),
  });

  await controller.loadInitial();
  await controller.loadTickets();
  const result = await controller.performTicketAction({
    ticketId: "fb_1",
    state: "resolved",
    priority: "urgent",
    labels: ["product", "bug", "route-guard"],
    assignee: {
      userId: "support_agent_2",
      label: "Case Owner",
      teamLabel: "Product Support",
    },
    queueKey: "product_support",
    queueLabel: "Product Support",
    sla: {
      policyKey: "product_issue_default_sla",
      label: "4 hour response",
      deadlineAt: "2026-04-08T15:30:00.000Z",
      breached: false,
    },
    supportReply: "We refreshed the affected cache and confirmed the route guard badge is correct now.",
  });

  assert.equal(result.ok, true);
  assert.equal(controller.store.getState().latestStatus?.state, "resolved");
  assert.equal(controller.store.getState().latestStatus?.assignee?.label, "Case Owner");
  assert.equal(controller.store.getState().ticketList?.items[0]?.priority, "urgent");
  assert.equal(
    controller.store.getState().latestStatus?.processingHistory.at(-1)?.note,
    "We refreshed the affected cache and confirmed the route guard badge is correct now.",
  );
});

test("feedback controller routes unauthorized bootstrap responses back to login", async () => {
  const { kernel, routeCalls, setRequestMode } = createKernelStub();
  setRequestMode("unauthorized");
  const controller = createFeedbackController({
    kernel,
    loginRouteId: APP_ROUTE_IDS.login,
    initialState: createDefaultFeedbackState(),
  });

  const result = await controller.loadInitial();

  assert.equal(result.ok, false);
  assert.equal(controller.store.getState().errorText, "Feedback session expired");
  assert.deepEqual(routeCalls.at(-1), {
    routeId: APP_ROUTE_IDS.login,
    params: {
      redirectPath: "/feedback",
      redirectSource: "feedback",
      redirectReason: "auth-required",
    },
  });
});
