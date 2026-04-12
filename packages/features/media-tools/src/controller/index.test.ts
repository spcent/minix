import test from "node:test";
import assert from "node:assert/strict";

import { ok, type AppKernel } from "@minix/core";
import { APP_ROUTE_IDS } from "@minix/contracts";

import { createMediaToolsController } from "./index";
import { createDefaultMediaToolsState } from "../model";

function createKernelStub() {
  const routeCalls: string[] = [];
  const clipboardWrites: string[] = [];
  const shareDispatches: string[] = [];
  let uploadRetryCount = 0;
  const uploadTransfer = {
    mode: "chunked" as const,
    checksumAlgorithm: "sha256" as const,
    fileChecksum: "checksum_file_cover",
    totalBytes: 100,
    chunkSizeBytes: 50,
    chunks: [
      {
        chunkIndex: 0,
        byteOffset: 0,
        byteLength: 50,
        checksum: "checksum_chunk_0",
        checksumAlgorithm: "sha256" as const,
        dataBase64: "Y2h1bmsw",
      },
      {
        chunkIndex: 1,
        byteOffset: 50,
        byteLength: 50,
        checksum: "checksum_chunk_1",
        checksumAlgorithm: "sha256" as const,
        dataBase64: "Y2h1bmsx",
      },
    ],
  };

  const kernel = {
    capability: {
      status(capability: string) {
        const available = capability === "upload" || capability === "share" || capability === "clipboard";
        return ok({
          capability: capability as "upload" | "share" | "clipboard",
          available,
          mode: available ? "native" : "unavailable",
          detail: available ? `${capability} capability is available.` : `${capability} capability is unavailable.`,
        });
      },
      async execute(input: { capability: string; action: string; payload?: Record<string, unknown> }) {
        if (input.capability === "upload") {
          return ok({
            capability: "upload",
            action: input.action,
            value: {
              uploadTask: {
                taskId: "task_1",
                scenario: "content",
                fileType: "image",
                stage: "completed",
                fileName: "cover.png",
                progress: {
                  completedBytes: 100,
                  totalBytes: 100,
                  percentage: 100,
              },
                chunkingReserved: false,
                governance: {
                  maxSizeBytes: 10_000_000,
                  acceptedFileTypes: ["image", "pdf", "attachment"],
                  sensitiveReviewRequired: true,
                  expiresInDays: 30,
                },
                reviewStatus: "pending",
                lifecycle: {
                  backendBacked: false,
                  retentionStatus: "active",
                  retryCount: 0,
                  canRetry: true,
                  canCancel: false,
                },
              },
              uploadAsset: {
                assetId: "asset_1",
                fileType: "image",
                fileName: "cover.png",
                url: "https://example.test/assets/cover.png",
                metadata: {
                  sizeBytes: 100,
                },
              },
              transfer: uploadTransfer,
            },
            detail: "Configured H5 upload runtime selected upload input.",
          });
        }

        if (input.capability === "clipboard") {
          clipboardWrites.push(String(input.payload?.text ?? ""));
          return ok({
            capability: "clipboard",
            action: input.action,
            detail: "Clipboard write completed.",
          });
        }

        shareDispatches.push(String((input.payload?.sharePayload as { title?: string } | undefined)?.title ?? ""));
        return ok({
          capability: "share",
          action: input.action,
          value: {
            sharePayload: {
              scenario: "invite",
              title: "Invite a friend to MiniX",
              landingPath: "/inbox",
              landingUrl: "https://example.test/inbox",
              shortLink: "https://mini.x/invite/demo",
              trackingParams: {
                channel: "host-h5",
              },
              channelMarker: "host-h5-demo",
              inviteCode: "MINIX42",
            },
            shareChannel: {
              kind: "copy_link",
              label: "Copy Link",
              executable: true,
              channelMarker: "host-h5-demo",
            },
            shareAttribution: {
              attributionId: "share_prepare_1",
              channelMarker: "host-h5-demo",
              inviteBindingEnabled: true,
              returnFlowRecognized: false,
              shareCount: 0,
              clickCount: 0,
              returnCount: 0,
              conversionCount: 0,
              preparedAt: "2026-04-08T09:39:00.000Z",
            },
          },
          detail: "Native browser share dispatched successfully.",
        });
      },
    },
    session: {
      async get() {
        return ok({
          identity: { userId: "shared-user" },
        });
      },
    },
    request: {
      async get<T>(path: string) {
        if (path.startsWith("/share/resolve")) {
          return ok({
            sharePayload: {
              scenario: "invite",
              title: "Invite a friend to MiniX",
              landingPath: "/login",
              landingUrl: "https://example.test/login?from=share",
              shortLink: "https://mini.x/s/share1",
              trackingParams: {
                channel: "host-h5",
              },
              channelMarker: "host-h5-demo",
              inviteCode: "MINIX42",
              shareToken: "share_prepare_1",
            },
            shareChannel: {
              kind: "copy_link",
              label: "Copy Link",
              executable: true,
              channelMarker: "host-h5-demo",
            },
            shareAttribution: {
              attributionId: "share_prepare_1",
              channelMarker: "host-h5-demo",
              inviteBindingEnabled: true,
              returnFlowRecognized: false,
              shareCount: 1,
              clickCount: 1,
              returnCount: 0,
              conversionCount: 0,
              preparedAt: "2026-04-08T09:39:00.000Z",
              lastSharedAt: "2026-04-08T09:39:00.000Z",
              lastClickAt: "2026-04-08T09:40:00.000Z",
              lastLandingPath: "/login",
            },
            shortLinkRecord: {
              attributionId: "share_prepare_1",
              shortCode: "share1",
              shortLink: "https://mini.x/s/share1",
              landingPath: "/login",
              landingUrl: "https://example.test/login?from=share",
              createdAt: "2026-04-08T09:39:00.000Z",
              resolvedCount: 1,
              lastResolvedAt: "2026-04-08T09:40:00.000Z",
            },
            attributionReport: {
              shareAttribution: {
                attributionId: "share_prepare_1",
                channelMarker: "host-h5-demo",
                inviteBindingEnabled: true,
                returnFlowRecognized: false,
                shareCount: 1,
                clickCount: 1,
                returnCount: 0,
                conversionCount: 0,
                preparedAt: "2026-04-08T09:39:00.000Z",
                lastSharedAt: "2026-04-08T09:39:00.000Z",
                lastClickAt: "2026-04-08T09:40:00.000Z",
                lastLandingPath: "/login",
              },
              shortLinkRecord: {
                attributionId: "share_prepare_1",
                shortCode: "share1",
                shortLink: "https://mini.x/s/share1",
                landingPath: "/login",
                landingUrl: "https://example.test/login?from=share",
                createdAt: "2026-04-08T09:39:00.000Z",
                resolvedCount: 1,
                lastResolvedAt: "2026-04-08T09:40:00.000Z",
              },
            },
            landingTarget: {
              path: "/login",
              url: "https://example.test/login?from=share",
              shortLink: "https://mini.x/s/share1",
              shortCode: "share1",
              channelMarker: "host-h5-demo",
            },
          } as T);
        }

        if (path.startsWith("/share/report")) {
          return ok({
            sharePayload: {
              scenario: "invite",
              title: "Invite a friend to MiniX",
              landingPath: "/login",
              landingUrl: "https://example.test/login?from=share",
              shortLink: "https://mini.x/s/share1",
              posterImageUrl: "https://example.test/posters/share1.svg",
              trackingParams: {
                channel: "host-h5",
              },
              channelMarker: "host-h5-demo",
              inviteCode: "MINIX42",
              shareToken: "share_prepare_1",
            },
            shareChannel: {
              kind: "copy_link",
              label: "Copy Link",
              executable: true,
              channelMarker: "host-h5-demo",
            },
            shareAttribution: {
              attributionId: "share_prepare_1",
              channelMarker: "host-h5-demo",
              inviteBindingEnabled: true,
              returnFlowRecognized: true,
              shareCount: 1,
              clickCount: 1,
              returnCount: 1,
              conversionCount: 1,
              preparedAt: "2026-04-08T09:39:00.000Z",
              lastSharedAt: "2026-04-08T09:39:00.000Z",
              lastClickAt: "2026-04-08T09:40:00.000Z",
              lastConversionAt: "2026-04-08T09:40:00.000Z",
              lastReturnAt: "2026-04-08T09:40:00.000Z",
              lastLandingPath: "/login",
              inviteBoundUserId: "shared-user",
            },
            shortLinkRecord: {
              attributionId: "share_prepare_1",
              shortCode: "share1",
              shortLink: "https://mini.x/s/share1",
              landingPath: "/login",
              landingUrl: "https://example.test/login?from=share",
              createdAt: "2026-04-08T09:39:00.000Z",
              resolvedCount: 1,
              lastResolvedAt: "2026-04-08T09:40:00.000Z",
            },
            posterAsset: {
              assetId: "share_poster_share1",
              provider: "sample",
              url: "https://example.test/posters/share1.svg",
              createdAt: "2026-04-08T09:39:00.000Z",
            },
            attributionReport: {
              shareAttribution: {
                attributionId: "share_prepare_1",
                channelMarker: "host-h5-demo",
                inviteBindingEnabled: true,
                returnFlowRecognized: true,
                shareCount: 1,
                clickCount: 1,
                returnCount: 1,
                conversionCount: 1,
                preparedAt: "2026-04-08T09:39:00.000Z",
                lastSharedAt: "2026-04-08T09:39:00.000Z",
                lastClickAt: "2026-04-08T09:40:00.000Z",
                lastConversionAt: "2026-04-08T09:40:00.000Z",
                lastReturnAt: "2026-04-08T09:40:00.000Z",
                lastLandingPath: "/login",
                inviteBoundUserId: "shared-user",
              },
              shortLinkRecord: {
                attributionId: "share_prepare_1",
                shortCode: "share1",
                shortLink: "https://mini.x/s/share1",
                landingPath: "/login",
                landingUrl: "https://example.test/login?from=share",
                createdAt: "2026-04-08T09:39:00.000Z",
                resolvedCount: 1,
                lastResolvedAt: "2026-04-08T09:40:00.000Z",
              },
              posterAsset: {
                assetId: "share_poster_share1",
                provider: "sample",
                url: "https://example.test/posters/share1.svg",
                createdAt: "2026-04-08T09:39:00.000Z",
              },
            },
            landingTarget: {
              path: "/login",
              url: "https://example.test/login?from=share",
              shortLink: "https://mini.x/s/share1",
              shortCode: "share1",
              channelMarker: "host-h5-demo",
            },
          } as T);
        }

        return ok({} as T);
      },
      async post<T>(path: string, body?: Record<string, unknown>) {
        if (path === "/share/prepare") {
          return ok({
            sharePayload: {
              ...(body?.sharePayload as Record<string, unknown>),
              landingPath: "/login",
              landingUrl: "https://example.test/login?from=share",
              shortLink: "https://mini.x/s/share1",
              channelMarker: "host-h5-demo",
              shareToken: "share_prepare_1",
              landingTarget: {
                path: "/login",
                url: "https://example.test/login?from=share",
                shortLink: "https://mini.x/s/share1",
                channelMarker: "host-h5-demo",
                authRedirect: {
                  path: "/workspace/media-tools",
                  source: "media-tools",
                  reason: "auth-required",
                },
              },
            },
            shareChannel: {
              ...(body?.shareChannel as Record<string, unknown>),
              channelMarker: "host-h5-demo",
            },
            shareAttribution: {
              ...(body?.shareAttribution as Record<string, unknown>),
              attributionId: "share_prepare_1",
              channelMarker: "host-h5-demo",
              returnFlowRecognized: false,
              shareCount: 1,
              returnCount: 0,
              preparedAt: "2026-04-08T09:39:00.000Z",
              lastSharedAt: "2026-04-08T09:39:00.000Z",
            },
            shortLinkRecord: {
              attributionId: "share_prepare_1",
              shortCode: "share1",
              shortLink: "https://mini.x/s/share1",
              landingPath: "/login",
              landingUrl: "https://example.test/login?from=share",
              createdAt: "2026-04-08T09:39:00.000Z",
              resolvedCount: 0,
            },
            attributionReport: {
              shareAttribution: {
                ...(body?.shareAttribution as Record<string, unknown>),
                attributionId: "share_prepare_1",
                channelMarker: "host-h5-demo",
                returnFlowRecognized: false,
                shareCount: 1,
                clickCount: 0,
                returnCount: 0,
                conversionCount: 0,
                preparedAt: "2026-04-08T09:39:00.000Z",
                lastSharedAt: "2026-04-08T09:39:00.000Z",
              },
              shortLinkRecord: {
                attributionId: "share_prepare_1",
                shortCode: "share1",
                shortLink: "https://mini.x/s/share1",
                landingPath: "/login",
                landingUrl: "https://example.test/login?from=share",
                createdAt: "2026-04-08T09:39:00.000Z",
                resolvedCount: 0,
              },
            },
            landingTarget: {
              path: "/login",
              url: "https://example.test/login?from=share",
              shortLink: "https://mini.x/s/share1",
              shortCode: "share1",
              channelMarker: "host-h5-demo",
              authRedirect: {
                path: "/workspace/media-tools",
                source: "media-tools",
                reason: "auth-required",
              },
            },
          } as T);
        }

        if (path === "/share/return") {
          return ok({
            sharePayload: {
              scenario: "invite",
              title: "Invite a friend to MiniX",
              landingPath: "/login",
              landingUrl: "https://example.test/login?from=share",
              shortLink: "https://mini.x/s/share1",
              trackingParams: {
                channel: "host-h5",
              },
              channelMarker: "host-h5-demo",
              inviteCode: "MINIX42",
              shareToken: "share_prepare_1",
            },
            shareChannel: {
              kind: "copy_link",
              label: "Copy Link",
              executable: true,
              channelMarker: "host-h5-demo",
            },
            shareAttribution: {
              attributionId: "share_prepare_1",
              channelMarker: "host-h5-demo",
              inviteBindingEnabled: true,
              returnFlowRecognized: true,
              shareCount: 1,
              clickCount: 1,
              returnCount: 1,
              conversionCount: 1,
              preparedAt: "2026-04-08T09:39:00.000Z",
              lastSharedAt: "2026-04-08T09:39:00.000Z",
              lastClickAt: "2026-04-08T09:40:00.000Z",
              lastConversionAt: "2026-04-08T09:40:00.000Z",
              lastReturnAt: "2026-04-08T09:40:00.000Z",
              lastLandingPath: "/login",
              inviteBoundUserId: "shared-user",
            },
            shortLinkRecord: {
              attributionId: "share_prepare_1",
              shortCode: "share1",
              shortLink: "https://mini.x/s/share1",
              landingPath: "/login",
              landingUrl: "https://example.test/login?from=share",
              createdAt: "2026-04-08T09:39:00.000Z",
              resolvedCount: 1,
              lastResolvedAt: "2026-04-08T09:40:00.000Z",
            },
            attributionReport: {
              shareAttribution: {
                attributionId: "share_prepare_1",
                channelMarker: "host-h5-demo",
                inviteBindingEnabled: true,
                returnFlowRecognized: true,
                shareCount: 1,
                clickCount: 1,
                returnCount: 1,
                conversionCount: 1,
                preparedAt: "2026-04-08T09:39:00.000Z",
                lastSharedAt: "2026-04-08T09:39:00.000Z",
                lastClickAt: "2026-04-08T09:40:00.000Z",
                lastConversionAt: "2026-04-08T09:40:00.000Z",
                lastReturnAt: "2026-04-08T09:40:00.000Z",
                lastLandingPath: "/login",
                inviteBoundUserId: "shared-user",
              },
              shortLinkRecord: {
                attributionId: "share_prepare_1",
                shortCode: "share1",
                shortLink: "https://mini.x/s/share1",
                landingPath: "/login",
                landingUrl: "https://example.test/login?from=share",
                createdAt: "2026-04-08T09:39:00.000Z",
                resolvedCount: 1,
                lastResolvedAt: "2026-04-08T09:40:00.000Z",
              },
            },
            landingTarget: {
              path: "/login",
              url: "https://example.test/login?from=share",
              shortLink: "https://mini.x/s/share1",
              shortCode: "share1",
              channelMarker: "host-h5-demo",
            },
          } as T);
        }

        if (path === "/share/resolve") {
          return ok({
            sharePayload: {
              scenario: "invite",
              title: "Invite a friend to MiniX",
              landingPath: "/login",
              landingUrl: "https://example.test/login?from=share",
              shortLink: "https://mini.x/s/share1",
              trackingParams: {
                channel: "host-h5",
              },
              channelMarker: "host-h5-demo",
              inviteCode: "MINIX42",
              shareToken: "share_prepare_1",
            },
            shareChannel: {
              kind: "copy_link",
              label: "Copy Link",
              executable: true,
              channelMarker: "host-h5-demo",
            },
            shareAttribution: {
              attributionId: "share_prepare_1",
              channelMarker: "host-h5-demo",
              inviteBindingEnabled: true,
              returnFlowRecognized: false,
              shareCount: 1,
              clickCount: 1,
              returnCount: 0,
              conversionCount: 0,
              preparedAt: "2026-04-08T09:39:00.000Z",
              lastSharedAt: "2026-04-08T09:39:00.000Z",
              lastClickAt: "2026-04-08T09:40:00.000Z",
              lastLandingPath: "/login",
            },
            shortLinkRecord: {
              attributionId: "share_prepare_1",
              shortCode: "share1",
              shortLink: "https://mini.x/s/share1",
              landingPath: "/login",
              landingUrl: "https://example.test/login?from=share",
              createdAt: "2026-04-08T09:39:00.000Z",
              resolvedCount: 1,
              lastResolvedAt: "2026-04-08T09:40:00.000Z",
            },
            attributionReport: {
              shareAttribution: {
                attributionId: "share_prepare_1",
                channelMarker: "host-h5-demo",
                inviteBindingEnabled: true,
                returnFlowRecognized: false,
                shareCount: 1,
                clickCount: 1,
                returnCount: 0,
                conversionCount: 0,
                preparedAt: "2026-04-08T09:39:00.000Z",
                lastSharedAt: "2026-04-08T09:39:00.000Z",
                lastClickAt: "2026-04-08T09:40:00.000Z",
                lastLandingPath: "/login",
              },
              shortLinkRecord: {
                attributionId: "share_prepare_1",
                shortCode: "share1",
                shortLink: "https://mini.x/s/share1",
                landingPath: "/login",
                landingUrl: "https://example.test/login?from=share",
                createdAt: "2026-04-08T09:39:00.000Z",
                resolvedCount: 1,
                lastResolvedAt: "2026-04-08T09:40:00.000Z",
              },
            },
            landingTarget: {
              path: "/login",
              url: "https://example.test/login?from=share",
              shortLink: "https://mini.x/s/share1",
              shortCode: "share1",
              channelMarker: "host-h5-demo",
            },
          } as T);
        }

        if (path === "/share/report") {
          return ok({
            sharePayload: {
              scenario: "invite",
              title: "Invite a friend to MiniX",
              landingPath: "/login",
              landingUrl: "https://example.test/login?from=share",
              shortLink: "https://mini.x/s/share1",
              posterImageUrl: "https://example.test/posters/share1.svg",
              trackingParams: {
                channel: "host-h5",
              },
              channelMarker: "host-h5-demo",
              inviteCode: "MINIX42",
              shareToken: "share_prepare_1",
            },
            shareChannel: {
              kind: "copy_link",
              label: "Copy Link",
              executable: true,
              channelMarker: "host-h5-demo",
            },
            shareAttribution: {
              attributionId: "share_prepare_1",
              channelMarker: "host-h5-demo",
              inviteBindingEnabled: true,
              returnFlowRecognized: true,
              shareCount: 1,
              clickCount: 1,
              returnCount: 1,
              conversionCount: 1,
              preparedAt: "2026-04-08T09:39:00.000Z",
              lastSharedAt: "2026-04-08T09:39:00.000Z",
              lastClickAt: "2026-04-08T09:40:00.000Z",
              lastConversionAt: "2026-04-08T09:40:00.000Z",
              lastReturnAt: "2026-04-08T09:40:00.000Z",
              lastLandingPath: "/login",
              inviteBoundUserId: "shared-user",
            },
            shortLinkRecord: {
              attributionId: "share_prepare_1",
              shortCode: "share1",
              shortLink: "https://mini.x/s/share1",
              landingPath: "/login",
              landingUrl: "https://example.test/login?from=share",
              createdAt: "2026-04-08T09:39:00.000Z",
              resolvedCount: 1,
              lastResolvedAt: "2026-04-08T09:40:00.000Z",
            },
            posterAsset: {
              assetId: "share_poster_share1",
              provider: "sample",
              url: "https://example.test/posters/share1.svg",
              createdAt: "2026-04-08T09:39:00.000Z",
            },
            attributionReport: {
              shareAttribution: {
                attributionId: "share_prepare_1",
                channelMarker: "host-h5-demo",
                inviteBindingEnabled: true,
                returnFlowRecognized: true,
                shareCount: 1,
                clickCount: 1,
                returnCount: 1,
                conversionCount: 1,
                preparedAt: "2026-04-08T09:39:00.000Z",
                lastSharedAt: "2026-04-08T09:39:00.000Z",
                lastClickAt: "2026-04-08T09:40:00.000Z",
                lastConversionAt: "2026-04-08T09:40:00.000Z",
                lastReturnAt: "2026-04-08T09:40:00.000Z",
                lastLandingPath: "/login",
                inviteBoundUserId: "shared-user",
              },
              shortLinkRecord: {
                attributionId: "share_prepare_1",
                shortCode: "share1",
                shortLink: "https://mini.x/s/share1",
                landingPath: "/login",
                landingUrl: "https://example.test/login?from=share",
                createdAt: "2026-04-08T09:39:00.000Z",
                resolvedCount: 1,
                lastResolvedAt: "2026-04-08T09:40:00.000Z",
              },
              posterAsset: {
                assetId: "share_poster_share1",
                provider: "sample",
                url: "https://example.test/posters/share1.svg",
                createdAt: "2026-04-08T09:39:00.000Z",
              },
            },
            landingTarget: {
              path: "/login",
              url: "https://example.test/login?from=share",
              shortLink: "https://mini.x/s/share1",
              shortCode: "share1",
              channelMarker: "host-h5-demo",
            },
          } as T);
        }

        if (path === "/uploads/session") {
          return ok({
            source: "backend_session",
            uploadTask: {
              taskId: "task_1",
              scenario: "content",
              fileType: "image",
              stage: "uploading",
              fileName: "cover.png",
              progress: {
                completedBytes: 0,
                totalBytes: 100,
                percentage: 0,
              },
              chunkingReserved: false,
              transferMode: "chunked",
              sessionId: "session_1",
              chunkCount: 2,
              uploadedChunkCount: 0,
              integrity: {
                checksumAlgorithm: "sha256",
                fileChecksum: uploadTransfer.fileChecksum,
                expectedSizeBytes: 100,
              },
              governance: {
                maxSizeBytes: 10_000_000,
                acceptedFileTypes: ["image", "pdf", "attachment"],
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
              assetId: "asset_backend_1",
              fileType: "image",
              fileName: "cover.png",
              url: "https://example.test/uploads/asset_backend_1",
              thumbnailUrl: "https://example.test/uploads/asset_backend_1/thumb",
              metadata: {
                sizeBytes: 100,
              },
            },
            transfer: uploadTransfer,
            session: {
              sessionId: "session_1",
              uploadToken: "token_1",
              objectKey: "object/asset_backend_1/session_1",
              mode: "chunked",
              checksumAlgorithm: "sha256",
              chunkSizeBytes: 50,
              chunkCount: 2,
              receivedChunkCount: 0,
              nextChunkIndex: 0,
              resumeSupported: true,
              createdAt: "2026-04-08T10:00:00.000Z",
              expiresAt: "2026-04-08T11:00:00.000Z",
            },
          } as T);
        }

        if (path === "/uploads/chunk") {
          const chunkIndex = Number((body?.chunk as { chunkIndex?: number } | undefined)?.chunkIndex ?? 0);
          return ok({
            source: "backend_chunk",
            uploadTask: {
              taskId: "task_1",
              scenario: "content",
              fileType: "image",
              stage: "uploading",
              fileName: "cover.png",
              progress: {
                completedBytes: chunkIndex === 0 ? 50 : 100,
                totalBytes: 100,
                percentage: chunkIndex === 0 ? 50 : 100,
              },
              chunkingReserved: false,
              transferMode: "chunked",
              sessionId: "session_1",
              chunkCount: 2,
              uploadedChunkCount: chunkIndex + 1,
              integrity: {
                checksumAlgorithm: "sha256",
                fileChecksum: uploadTransfer.fileChecksum,
                expectedSizeBytes: 100,
              },
              governance: {
                maxSizeBytes: 10_000_000,
                acceptedFileTypes: ["image", "pdf", "attachment"],
                sensitiveReviewRequired: true,
                expiresInDays: 30,
              },
              reviewStatus: "not_required",
              reviewMessage: `Chunk ${chunkIndex + 1} uploaded.`,
              lifecycle: {
                backendBacked: true,
                retentionStatus: "active",
                retryCount: uploadRetryCount,
                canRetry: false,
                canCancel: true,
                lastTransitionAt: "2026-04-08T10:02:00.000Z",
                expiresAt: "2026-05-08T10:00:00.000Z",
              },
            },
            uploadAsset: {
              assetId: "asset_backend_1",
              fileType: "image",
              fileName: "cover.png",
              url: "https://example.test/uploads/asset_backend_1",
              thumbnailUrl: "https://example.test/uploads/asset_backend_1/thumb",
              metadata: {
                sizeBytes: 100,
              },
            },
            transfer: uploadTransfer,
            session: {
              sessionId: "session_1",
              uploadToken: "token_1",
              objectKey: "object/asset_backend_1/session_1",
              mode: "chunked",
              checksumAlgorithm: "sha256",
              chunkSizeBytes: 50,
              chunkCount: 2,
              receivedChunkCount: chunkIndex + 1,
              nextChunkIndex: chunkIndex + 1,
              resumeSupported: true,
              createdAt: "2026-04-08T10:00:00.000Z",
              expiresAt: "2026-04-08T11:00:00.000Z",
            },
            receivedChunk: {
              chunkIndex,
              byteOffset: chunkIndex * 50,
              byteLength: 50,
              checksum: `checksum_chunk_${chunkIndex}`,
              checksumAlgorithm: "sha256",
              receivedAt: "2026-04-08T10:02:00.000Z",
            },
          } as T);
        }

        if (path === "/uploads/complete") {
          return ok({
            source: "backend_complete",
            uploadTask: {
              taskId: "task_1",
              scenario: "content",
              fileType: "image",
              stage: "reviewing",
              fileName: "cover.png",
              progress: {
                completedBytes: 100,
                totalBytes: 100,
                percentage: 100,
              },
              chunkingReserved: false,
              transferMode: "chunked",
              sessionId: "session_1",
              chunkCount: 2,
              uploadedChunkCount: 2,
              integrity: {
                checksumAlgorithm: "sha256",
                fileChecksum: uploadTransfer.fileChecksum,
                expectedSizeBytes: 100,
              },
              governance: {
                maxSizeBytes: 10_000_000,
                acceptedFileTypes: ["image", "pdf", "attachment"],
                sensitiveReviewRequired: true,
                expiresInDays: 30,
              },
              reviewStatus: "pending",
              reviewMessage: "Sensitive review is pending in the upload pipeline.",
              lifecycle: {
                backendBacked: true,
                retentionStatus: "active",
                retryCount: uploadRetryCount,
                canRetry: false,
                canCancel: true,
                lastTransitionAt: "2026-04-08T10:03:00.000Z",
                expiresAt: "2026-05-08T10:00:00.000Z",
              },
            },
            uploadAsset: {
              assetId: "asset_backend_1",
              fileType: "image",
              fileName: "cover.png",
              url: "https://example.test/uploads/asset_backend_1",
              thumbnailUrl: "https://example.test/uploads/asset_backend_1/thumb",
              metadata: {
                sizeBytes: 100,
                checksum: uploadTransfer.fileChecksum,
                checksumAlgorithm: "sha256",
              },
            },
          } as T);
        }

        if (path === "/uploads/retry") {
          uploadRetryCount += 1;
          return ok({
            source: "backend_retry",
            uploadTask: {
              taskId: body?.taskId,
              scenario: "content",
              fileType: "image",
              stage: "uploading",
              fileName: "cover.png",
              progress: {
                completedBytes: 0,
                totalBytes: 100,
                percentage: 0,
              },
              chunkingReserved: false,
              transferMode: "chunked",
              sessionId: "session_retry_1",
              chunkCount: 2,
              uploadedChunkCount: 0,
              integrity: {
                checksumAlgorithm: "sha256",
                fileChecksum: uploadTransfer.fileChecksum,
                expectedSizeBytes: 100,
              },
              governance: {
                maxSizeBytes: 10_000_000,
                acceptedFileTypes: ["image", "pdf", "attachment"],
                sensitiveReviewRequired: true,
                expiresInDays: 30,
              },
              reviewStatus: "not_required",
              reviewMessage: "Upload retry prepared. Resume remaining chunks.",
              lifecycle: {
                backendBacked: true,
                retentionStatus: "active",
                retryCount: uploadRetryCount,
                canRetry: false,
                canCancel: true,
                lastTransitionAt: "2026-04-08T10:05:00.000Z",
                expiresAt: "2026-05-08T10:00:00.000Z",
              },
            },
            uploadAsset: {
              assetId: "asset_backend_1",
              fileType: "image",
              fileName: "cover.png",
              url: "https://example.test/uploads/asset_backend_1",
              thumbnailUrl: "https://example.test/uploads/asset_backend_1/thumb",
              metadata: {
                sizeBytes: 100,
              },
            },
            transfer: uploadTransfer,
            session: {
              sessionId: "session_retry_1",
              uploadToken: "token_retry_1",
              objectKey: "object/asset_backend_1/session_retry_1",
              mode: "chunked",
              checksumAlgorithm: "sha256",
              chunkSizeBytes: 50,
              chunkCount: 2,
              receivedChunkCount: 0,
              nextChunkIndex: 0,
              resumeSupported: true,
              createdAt: "2026-04-08T10:05:00.000Z",
              expiresAt: "2026-04-08T11:05:00.000Z",
            },
          } as T);
        }

        if (path === "/uploads/cancel") {
          return ok({
            source: "backend_cancel",
            uploadTask: {
              taskId: body?.taskId,
              scenario: "content",
              fileType: "image",
              stage: "canceled",
              fileName: "cover.png",
              progress: {
                completedBytes: 100,
                totalBytes: 100,
                percentage: 100,
              },
              chunkingReserved: false,
              governance: {
                maxSizeBytes: 10_000_000,
                acceptedFileTypes: ["image", "pdf", "attachment"],
                sensitiveReviewRequired: true,
                expiresInDays: 30,
              },
              reviewStatus: "pending",
              reviewMessage: "Upload cancelled: user_cancelled.",
              lifecycle: {
                backendBacked: true,
                retentionStatus: "scheduled_cleanup",
                retryCount: uploadRetryCount,
                canRetry: true,
                canCancel: false,
                lastTransitionAt: "2026-04-08T10:06:00.000Z",
                expiresAt: "2026-05-08T10:00:00.000Z",
              },
            },
            uploadAsset: {
              assetId: "asset_backend_1",
              fileType: "image",
              fileName: "cover.png",
              url: "https://example.test/uploads/asset_backend_1",
              thumbnailUrl: "https://example.test/uploads/asset_backend_1/thumb",
              metadata: {
                sizeBytes: 100,
              },
            },
            uploadError: {
              code: "UPLOAD_CANCELLED",
              message: "Upload cancelled: user_cancelled.",
              recoverable: true,
              retryable: true,
              stage: "canceled",
            },
          } as T);
        }

        return ok({} as T);
      },
    },
    router: {
      async toRoute(routeId: string) {
        routeCalls.push(routeId);
        return ok(undefined);
      },
      current() {
        return ok({
          path: "/workspace/media-tools",
          params: {
            from: "workspace",
          },
        });
      },
    },
  } as unknown as AppKernel;

  return {
    kernel,
    routeCalls,
    clipboardWrites,
    shareDispatches,
  };
}

test("media-tools controller loads capability availability", () => {
  const { kernel } = createKernelStub();
  const controller = createMediaToolsController({
    kernel,
    initialState: createDefaultMediaToolsState(),
  });

  controller.loadInitial();

  assert.equal(controller.store.getState().ready, true);
  assert.equal(controller.store.getState().uploadAvailable, true);
  assert.equal(controller.store.getState().shareAvailable, true);
  assert.equal(controller.store.getState().uploadCapabilityStatus?.mode, "native");
  assert.equal(controller.store.getState().shareCapabilityStatus?.mode, "native");
  assert.equal(controller.store.getState().uploadProviderSummary.includes("sample-upload-policy"), true);
  assert.equal(controller.store.getState().shareProviderSummary.includes("sample-backed"), true);
});

test("media-tools controller surfaces degraded fallback capability metadata", () => {
  const { kernel } = createKernelStub();
  kernel.capability!.status = (capability: string) =>
    ok({
      capability: capability as "clipboard" | "device" | "location" | "payment" | "share" | "subscription" | "upload",
      available: capability === "share" || capability === "clipboard",
      mode: capability === "share" ? "degraded" : capability === "clipboard" ? "native" : "unavailable",
      detail:
        capability === "share"
          ? "Native share is unavailable. Falling back to clipboard copy."
          : capability === "clipboard"
            ? "Clipboard is available."
            : "Capability is unavailable.",
      ...(capability === "share" ? { fallbackActionLabel: "Copy share link" } : {}),
    });

  const controller = createMediaToolsController({
    kernel,
    initialState: createDefaultMediaToolsState(),
  });

  controller.loadInitial();

  assert.equal(controller.store.getState().shareAvailable, true);
  assert.equal(controller.store.getState().shareCapabilityStatus?.mode, "degraded");
  assert.equal(controller.store.getState().shareCapabilityStatus?.fallbackActionLabel, "Copy share link");
});

test("media-tools controller stores upload contract output after the primary action", async () => {
  const { kernel } = createKernelStub();
  const controller = createMediaToolsController({
    kernel,
    initialState: createDefaultMediaToolsState(),
  });

  await controller.startUpload();

  assert.equal(controller.store.getState().uploadTask.stage, "reviewing");
  assert.equal(controller.store.getState().uploadTask.lifecycle.backendBacked, true);
  assert.equal(controller.store.getState().uploadAsset?.assetId, "asset_backend_1");
  assert.equal(controller.store.getState().lastResult?.status, "succeeded");
  assert.equal(controller.store.getState().uploadProviderSummary.includes("sample-upload-policy"), true);
});

test("media-tools controller can cancel and retry the backend-backed upload task", async () => {
  const { kernel } = createKernelStub();
  const controller = createMediaToolsController({
    kernel,
    initialState: createDefaultMediaToolsState(),
  });

  await controller.startUpload();
  await controller.cancelUpload("user_cancelled");

  assert.equal(controller.store.getState().uploadTask.stage, "canceled");
  assert.equal(controller.store.getState().uploadTask.lifecycle.canRetry, true);
  assert.equal(controller.store.getState().uploadError?.code, "UPLOAD_CANCELLED");

  await controller.retryPrimaryAction();

  assert.equal(controller.store.getState().uploadTask.stage, "reviewing");
  assert.equal(controller.store.getState().uploadTask.lifecycle.retryCount, 1);
});

test("media-tools controller stores share contract output after the secondary action", async () => {
  const { kernel, clipboardWrites } = createKernelStub();
  const controller = createMediaToolsController({
    kernel,
    initialState: createDefaultMediaToolsState(),
  });

  await controller.startShare();

  assert.equal(clipboardWrites[0], "https://mini.x/s/share1");
  assert.equal(controller.store.getState().shareAttribution.shareCount, 1);
  assert.equal(controller.store.getState().shareAttribution.returnFlowRecognized, true);
  assert.equal(controller.store.getState().shareAttribution.clickCount, 1);
  assert.equal(controller.store.getState().shareAttribution.returnCount, 1);
  assert.equal(controller.store.getState().shareAttribution.conversionCount, 1);
  assert.equal(controller.store.getState().lastResult?.message.includes("Share link copied"), true);
  assert.equal(controller.store.getState().shareProviderSummary.includes("sample-backed"), true);
});

test("media-tools controller supports native share channels through the same prepared attribution flow", async () => {
  const { kernel, shareDispatches } = createKernelStub();
  const controller = createMediaToolsController({
    kernel,
    initialState: {
      ...createDefaultMediaToolsState(),
      shareChannel: {
        kind: "wechat_session",
        label: "WeChat Session",
        executable: true,
        channelMarker: "wechat",
      },
    },
  });

  await controller.startShare();

  assert.equal(shareDispatches[0], "Invite a friend to MiniX");
  assert.equal(controller.store.getState().shareAttribution.returnFlowRecognized, true);
});

test("media-tools controller can load the attribution report after share resolution", async () => {
  const { kernel } = createKernelStub();
  const controller = createMediaToolsController({
    kernel,
    initialState: createDefaultMediaToolsState(),
  });

  await controller.startShare();
  await controller.loadShareReport();

  assert.equal(controller.store.getState().shareAttribution.clickCount, 1);
  assert.equal(controller.store.getState().shareAttribution.returnCount, 1);
  assert.equal(controller.store.getState().shareAttribution.conversionCount, 1);
  assert.equal(controller.store.getState().sharePayload.posterImageUrl, "https://example.test/posters/share1.svg");
  assert.equal(controller.store.getState().lastResult?.message, "Share attribution report loaded.");
  assert.equal(controller.store.getState().shareProviderSummary.includes("sample-backed"), true);
});

test("media-tools controller can route into settings when configured", async () => {
  const { kernel, routeCalls } = createKernelStub();
  const controller = createMediaToolsController({
    kernel,
    settingsRouteId: APP_ROUTE_IDS.settings,
    initialState: createDefaultMediaToolsState(),
  });

  await controller.goToSettings();

  assert.deepEqual(routeCalls, [APP_ROUTE_IDS.settings]);
});
