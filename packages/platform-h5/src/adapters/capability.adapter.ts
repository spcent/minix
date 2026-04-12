import type {
  CapabilityActionInput,
  CapabilityActionResult,
  CapabilityKind,
  CapabilityStatus,
  UploadFileType,
  UploadSelectionResult,
} from "@minix/contracts";
import { createError, fail, ok, type CapabilityAdapter } from "@minix/core";

interface H5Clipboard {
  writeText?: (text: string) => Promise<void>;
}

interface H5NavigatorLike {
  clipboard?: H5Clipboard;
  geolocation?: {
    getCurrentPosition?: (
      success: (position: Record<string, unknown>) => void,
      fail?: (error: unknown) => void,
      options?: Record<string, unknown>,
    ) => void;
  };
  language?: string;
  platform?: string;
  share?: (data: Record<string, unknown>) => Promise<void>;
  userAgent?: string;
}

interface H5FileLike {
  arrayBuffer?: () => Promise<ArrayBuffer>;
  name?: string;
  size?: number;
  type?: string;
}

interface H5InputLike {
  type?: string;
  accept?: string;
  multiple?: boolean;
  files?: ArrayLike<H5FileLike> | null;
  onchange?: (() => void) | null;
  oncancel?: (() => void) | null;
  click?: () => void;
}

interface H5DocumentLike {
  createElement?: (tagName: string) => H5InputLike;
}

interface H5PaymentRuntime {
  startPayment?: (payload: Record<string, unknown>) => Promise<Record<string, unknown> | void>;
}

interface H5UploadRuntime {
  selectFiles?: (payload: Record<string, unknown>) => Promise<Record<string, unknown> | void>;
}

export interface H5CapabilityAdapterOptions {
  navigator?: H5NavigatorLike;
  document?: H5DocumentLike;
  payment?: H5PaymentRuntime;
  upload?: H5UploadRuntime;
}

function requirePayloadText(input: CapabilityActionInput): string | null {
  if (typeof input.payload !== "object" || input.payload === null || !("text" in input.payload)) {
    return null;
  }

  const text = (input.payload as { text?: unknown }).text;
  return typeof text === "string" ? text : null;
}

export function createH5CapabilityAdapter(options: H5CapabilityAdapterOptions = {}): CapabilityAdapter {
  const navigator = options.navigator ?? globalThis.navigator;
  const document = (options.document ?? globalThis.document) as H5DocumentLike | undefined;
  const payment = options.payment;
  const upload = options.upload;

  function createCapabilityStatus(
    capability: CapabilityKind,
    input: Omit<CapabilityStatus, "capability">,
  ) {
    return ok({
      capability,
      ...input,
    });
  }

  function hasFilePickerSupport() {
    return Boolean(document?.createElement);
  }

  function mapAcceptTypes(fileTypes: UploadFileType[] | undefined, preferredType?: UploadFileType): string {
    const accepted = new Set<UploadFileType>([...(fileTypes ?? []), ...(preferredType ? [preferredType] : [])]);
    const mimeTypes: string[] = [];
    for (const entry of accepted) {
      if (entry === "image" || entry === "avatar") {
        mimeTypes.push("image/*");
      } else if (entry === "video") {
        mimeTypes.push("video/*");
      } else if (entry === "audio") {
        mimeTypes.push("audio/*");
      } else if (entry === "pdf") {
        mimeTypes.push("application/pdf");
      } else if (entry === "attachment") {
        mimeTypes.push("*/*");
      }
    }

    return mimeTypes.join(",");
  }

  function inferUploadFileType(input: CapabilityActionInput, file: H5FileLike): UploadFileType {
    if (typeof input.payload === "object" && input.payload !== null) {
      const preferred = (input.payload as { preferredFileType?: UploadFileType }).preferredFileType;
      if (preferred) {
        return preferred;
      }
    }

    if (typeof file.type === "string") {
      if (file.type.startsWith("image/")) {
        return "image";
      }
      if (file.type.startsWith("video/")) {
        return "video";
      }
      if (file.type.startsWith("audio/")) {
        return "audio";
      }
      if (file.type === "application/pdf") {
        return "pdf";
      }
    }

    return "attachment";
  }

  function toBase64(bytes: Uint8Array): string {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(bytes).toString("base64");
    }

    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return globalThis.btoa(binary);
  }

  function createChecksum(bytes: Uint8Array): string {
    let checksum = 0;
    for (const byte of bytes) {
      checksum = (checksum + byte) % 1_000_000_007;
    }
    return `h5_${bytes.length}_${checksum}`;
  }

  async function buildSelectionResult(input: CapabilityActionInput, file: H5FileLike): Promise<UploadSelectionResult> {
    const payload = typeof input.payload === "object" && input.payload !== null ? (input.payload as Record<string, unknown>) : {};
    const fileType = inferUploadFileType(input, file);
    const buffer = file.arrayBuffer ? await file.arrayBuffer() : new ArrayBuffer(0);
    const bytes = new Uint8Array(buffer);
    const chunkSizeBytes = bytes.length > 512 * 1024 ? 256 * 1024 : Math.max(bytes.length || 1, 1);
    const chunks = [];
    for (let offset = 0; offset < bytes.length || (bytes.length === 0 && offset === 0); offset += chunkSizeBytes) {
      const slice = bytes.slice(offset, Math.min(offset + chunkSizeBytes, bytes.length));
      const normalizedSlice = bytes.length === 0 ? new Uint8Array(0) : slice;
      chunks.push({
        chunkIndex: chunks.length,
        byteOffset: offset,
        byteLength: normalizedSlice.length,
        checksum: createChecksum(normalizedSlice),
        checksumAlgorithm: "sha256" as const,
        dataBase64: toBase64(normalizedSlice),
      });
      if (bytes.length === 0) {
        break;
      }
    }

    const fileChecksum = createChecksum(bytes);
    return {
      uploadTask: {
        taskId: `h5_upload_${Date.now()}`,
        scenario:
          payload.scenario === "avatar" || payload.scenario === "attachment" || payload.scenario === "content"
            ? payload.scenario
            : "content",
        fileType,
        stage: "chunking_reserved",
        fileName: file.name ?? "selected-file",
        progress: {
          completedBytes: 0,
          totalBytes: file.size ?? bytes.length,
          percentage: 0,
        },
        chunkingReserved: true,
        transferMode: chunks.length > 1 ? "chunked" : "single_part",
        chunkCount: chunks.length,
        uploadedChunkCount: 0,
        integrity: {
          checksumAlgorithm: "sha256",
          fileChecksum,
          expectedSizeBytes: file.size ?? bytes.length,
        },
        governance:
          typeof payload.governance === "object" && payload.governance !== null
            ? (payload.governance as UploadSelectionResult["uploadTask"]["governance"])
            : {
                maxSizeBytes: 10_000_000,
                acceptedFileTypes: ["image", "attachment"],
                sensitiveReviewRequired: true,
              },
        reviewStatus: "pending",
        lifecycle: {
          backendBacked: false,
          retentionStatus: "active",
          retryCount: 0,
          canRetry: true,
          canCancel: true,
        },
      },
      transfer: {
        mode: chunks.length > 1 ? "chunked" : "single_part",
        checksumAlgorithm: "sha256",
        fileChecksum,
        totalBytes: file.size ?? bytes.length,
        chunkSizeBytes,
        chunks,
      },
    };
  }

  async function selectFilesFromDocument(input: CapabilityActionInput): Promise<UploadSelectionResult> {
    if (!document?.createElement) {
      throw createError("CAPABILITY_UNAVAILABLE", "h5 file picker is unavailable", { recoverable: true });
    }

    const payload = typeof input.payload === "object" && input.payload !== null ? (input.payload as Record<string, unknown>) : {};
    const picker = document.createElement("input");
    picker.type = "file";
    picker.multiple = Number(payload.maxSelectCount ?? 1) > 1;
    picker.accept = mapAcceptTypes(
      Array.isArray(payload.acceptedFileTypes) ? (payload.acceptedFileTypes as UploadFileType[]) : undefined,
      typeof payload.preferredFileType === "string" ? (payload.preferredFileType as UploadFileType) : undefined,
    );

    return new Promise<UploadSelectionResult>((resolve, reject) => {
      picker.onchange = async () => {
        try {
          const file = picker.files?.[0];
          if (!file) {
            reject(createError("USER_CANCELLED", "No file was selected", { recoverable: true }));
            return;
          }
          resolve(await buildSelectionResult(input, file));
        } catch (error) {
          reject(error);
        }
      };
      picker.oncancel = () => {
        reject(createError("USER_CANCELLED", "File selection was cancelled", { recoverable: true }));
      };
      picker.click?.();
    });
  }

  function resolveShareText(payload: Record<string, unknown>): string {
    const sharePayload =
      typeof payload.sharePayload === "object" && payload.sharePayload !== null
        ? (payload.sharePayload as Record<string, unknown>)
        : {};
    const shareChannel =
      typeof payload.shareChannel === "object" && payload.shareChannel !== null
        ? (payload.shareChannel as Record<string, unknown>)
        : {};
    const shareKind = typeof shareChannel.kind === "string" ? shareChannel.kind : "";

    if (shareKind === "poster_image" && typeof sharePayload.posterImageUrl === "string") {
      return sharePayload.posterImageUrl;
    }

    return (
      (typeof sharePayload.shortLink === "string" ? sharePayload.shortLink : undefined) ??
      (typeof sharePayload.landingUrl === "string" ? sharePayload.landingUrl : undefined) ??
      (typeof sharePayload.title === "string" ? sharePayload.title : "")
    );
  }

  return {
    status(capability) {
      switch (capability) {
        case "clipboard":
          return navigator?.clipboard?.writeText
            ? createCapabilityStatus(capability, { available: true, mode: "native", detail: "Browser clipboard API is available." })
            : createCapabilityStatus(capability, {
                available: false,
                mode: "unavailable",
                detail: "Clipboard API is unavailable in this browser.",
                reason: "clipboard-api-missing",
              });
        case "device":
          return navigator
            ? createCapabilityStatus(capability, { available: true, mode: "native", detail: "Browser navigator metadata is available." })
            : createCapabilityStatus(capability, {
                available: false,
                mode: "unavailable",
                detail: "Navigator metadata is unavailable.",
                reason: "navigator-missing",
              });
        case "location":
          return navigator?.geolocation?.getCurrentPosition
            ? createCapabilityStatus(capability, { available: true, mode: "native", detail: "Browser geolocation is available." })
            : createCapabilityStatus(capability, {
                available: false,
                mode: "unavailable",
                detail: "Browser geolocation is unavailable.",
                reason: "geolocation-api-missing",
              });
        case "share":
          return navigator?.share
            ? createCapabilityStatus(capability, { available: true, mode: "native", detail: "Native browser share is available." })
            : navigator?.clipboard?.writeText
              ? createCapabilityStatus(capability, {
                  available: true,
                  mode: "degraded",
                  detail: "Native browser share is unavailable. Falling back to clipboard copy.",
                  reason: "clipboard-fallback",
                  fallbackActionLabel: "Copy share link",
                })
              : createCapabilityStatus(capability, {
                  available: false,
                  mode: "unavailable",
                  detail: "Neither native share nor clipboard fallback is available.",
                  reason: "share-api-missing",
                });
        case "payment":
          return payment?.startPayment
            ? createCapabilityStatus(capability, {
                available: true,
                mode: "native",
                detail: "Configured H5 payment runtime is available.",
              })
            : createCapabilityStatus(capability, {
                available: false,
                mode: "unavailable",
                detail: "No H5 payment runtime is configured for this host.",
                reason: "payment-runtime-missing",
              });
        case "upload":
          return upload?.selectFiles
            ? createCapabilityStatus(capability, {
                available: true,
                mode: "native",
                detail: "Configured H5 upload runtime is available.",
              })
            : hasFilePickerSupport()
              ? createCapabilityStatus(capability, {
                  available: true,
                  mode: "native",
                  detail: "Browser file picker fallback is available.",
                })
              : createCapabilityStatus(capability, {
                  available: false,
                  mode: "unavailable",
                  detail: "No upload runtime or browser file picker is available.",
                  reason: "upload-picker-missing",
                });
        default:
          return createCapabilityStatus(capability, {
            available: false,
            mode: "unavailable",
            detail: `h5 capability "${capability}" is not implemented`,
            reason: "unsupported-capability",
          });
      }
    },

    async execute<TResult = unknown>(input: CapabilityActionInput): Promise<import("@minix/core").Result<CapabilityActionResult<TResult>>> {
      switch (input.capability) {
        case "clipboard": {
          try {
            const text = requirePayloadText(input);
            if (text === null) {
              return fail(createError("INVALID_ARGUMENT", "clipboard.writeText requires a text payload", { recoverable: true }));
            }

            if (!navigator?.clipboard?.writeText) {
              return fail(createError("CAPABILITY_UNAVAILABLE", "clipboard capability is unavailable", { recoverable: true }));
            }

            await navigator.clipboard.writeText(text);
            return ok({
              capability: input.capability,
              action: input.action,
            } as CapabilityActionResult<TResult>);
          } catch (error) {
            return fail(createError("CAPABILITY_UNAVAILABLE", "clipboard write failed", {
              cause: error,
              recoverable: true,
            }));
          }
        }

        case "share":
          try {
            const payload = typeof input.payload === "object" && input.payload !== null ? input.payload as Record<string, unknown> : {};
            if (navigator?.share) {
              const sharePayload =
                typeof payload.sharePayload === "object" && payload.sharePayload !== null
                  ? (payload.sharePayload as Record<string, unknown>)
                  : payload;
              const browserSharePayload = {
                ...(typeof sharePayload.title === "string" ? { title: sharePayload.title } : {}),
                ...(typeof sharePayload.summary === "string" ? { text: sharePayload.summary } : {}),
                url: resolveShareText(payload),
              };
              await navigator.share({
                ...browserSharePayload,
              });
              return ok({
                capability: input.capability,
                action: input.action,
                value: payload as TResult,
                detail: "Native browser share dispatched successfully.",
              } as CapabilityActionResult<TResult>);
            }

            if (navigator?.clipboard?.writeText) {
              await navigator.clipboard.writeText(resolveShareText(payload));
              return ok({
                capability: input.capability,
                action: input.action,
                value: payload as TResult,
                detail: "Native browser share was unavailable. Copied the share target to clipboard instead.",
                degraded: true,
                fallbackActionLabel: "Copy share link",
              } as CapabilityActionResult<TResult>);
            }

            return fail(createError("CAPABILITY_UNAVAILABLE", "share capability is unavailable", { recoverable: true }));
          } catch (error) {
            return fail(createError("CAPABILITY_UNAVAILABLE", "share failed", {
              cause: error,
              recoverable: true,
            }));
          }

        case "device":
          return ok({
            capability: input.capability,
            action: input.action,
            value: {
              userAgent: navigator?.userAgent ?? "",
              language: navigator?.language ?? "",
              platform: navigator?.platform ?? "",
            } as TResult,
          });

        case "location":
          if (!navigator?.geolocation?.getCurrentPosition) {
            return fail(createError("CAPABILITY_UNAVAILABLE", "location capability is unavailable", { recoverable: true }));
          }

          return new Promise((resolve) => {
            navigator.geolocation?.getCurrentPosition?.(
              (position) =>
                resolve(
                  ok({
                    capability: input.capability,
                    action: input.action,
                    value: position as TResult,
                    detail: "Browser geolocation resolved successfully.",
                  }),
                ),
              (error) =>
                resolve(
                  fail(
                    createError("CAPABILITY_UNAVAILABLE", "browser geolocation failed", {
                      cause: error,
                      recoverable: true,
                    }),
                  ),
                ),
            );
          });

        case "payment":
          try {
            if (!payment?.startPayment) {
              return fail(createError("CAPABILITY_UNAVAILABLE", "payment capability is unavailable", { recoverable: true }));
            }

            const value = await payment.startPayment(
              typeof input.payload === "object" && input.payload !== null ? (input.payload as Record<string, unknown>) : {},
            );
            return ok({
              capability: input.capability,
              action: input.action,
              ...(value ? { value: value as TResult } : {}),
              detail: "H5 payment runtime executed with gateway client parameters.",
            });
          } catch (error) {
            return fail(createError("CAPABILITY_UNAVAILABLE", "h5 payment execution failed", {
              cause: error,
              recoverable: true,
            }));
          }

        case "upload":
          try {
            const payload = typeof input.payload === "object" && input.payload !== null ? (input.payload as Record<string, unknown>) : {};
            const value = upload?.selectFiles ? await upload.selectFiles(payload) : await selectFilesFromDocument(input);
            return ok({
              capability: input.capability,
              action: input.action,
              ...(value ? { value: value as TResult } : {}),
              detail: upload?.selectFiles
                ? "Configured H5 upload runtime selected upload input."
                : "Browser file picker selected upload input and prepared transfer payload.",
            });
          } catch (error) {
            if (typeof error === "object" && error !== null && "code" in error && "message" in error) {
              return fail(error as ReturnType<typeof createError>);
            }
            return fail(
              createError("CAPABILITY_UNAVAILABLE", "h5 upload selection failed", {
                cause: error,
                recoverable: true,
              }),
            );
          }

        default:
          return fail(createError("PLATFORM_UNSUPPORTED", `h5 capability "${input.capability}" is not implemented`, {
            recoverable: false,
          }));
      }
    },
  };
}
