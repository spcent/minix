import test from "node:test";
import assert from "node:assert/strict";

import { ok, type AppKernel } from "@minix/core";
import { APP_ROUTE_IDS, type FeedbackBootstrapResponse, type FeedbackTicketDetailResponse } from "@minix/contracts";

import { createFeedbackController } from "./index";
import { createDefaultFeedbackState } from "../model";

function createKernelStub() {
  const routeCalls: Array<{ routeId: string; params?: Record<string, string | number | boolean> }> = [];
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
        return ok(capability === "device" || capability === "upload");
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
            supportEntry: {
              entryId: "support_feedback",
              label: "Open Support Desk",
              summary: "Continue follow-up in the inbox support thread.",
              channel: "messages",
              routeId: APP_ROUTE_IDS.messages,
              threadId: "thread_customer_service",
            },
            serviceLoopSummary: "Use the support entry if you need to add more context.",
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

      const request = payload as {
        title: string;
          description: string;
          revisitRequested?: boolean;
          context: { screenshotAssets: unknown[] };
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
