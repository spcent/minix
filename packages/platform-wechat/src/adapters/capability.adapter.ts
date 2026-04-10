import type { CapabilityActionInput, CapabilityActionResult } from "@minix/contracts";
import { createError, fail, ok, type CapabilityAdapter } from "@minix/core";

import { resolveWechatRuntime } from "../runtime";

interface WechatCapabilityRuntime {
  getLocation?: unknown;
  getSystemInfo?: (options: {
    success?: (result: Record<string, unknown>) => void;
    fail?: (error: unknown) => void;
  }) => void;
  setClipboardData?: (options: {
    data: string;
    success?: () => void;
    fail?: (error: unknown) => void;
  }) => void;
  showShareMenu?: (options: {
    success?: () => void;
    fail?: (error: unknown) => void;
  }) => void;
  chooseMedia?: (options: {
    count?: number;
    mediaType?: Array<"image" | "video">;
    success?: (result: Record<string, unknown>) => void;
    fail?: (error: unknown) => void;
  }) => void;
  chooseMessageFile?: (options: {
    count?: number;
    type?: "file" | "image" | "video";
    success?: (result: Record<string, unknown>) => void;
    fail?: (error: unknown) => void;
  }) => void;
  requestPayment?: (options: Record<string, unknown> & {
    success?: (result?: Record<string, unknown>) => void;
    fail?: (error: unknown) => void;
  }) => void;
}

function requirePayloadText(input: CapabilityActionInput): string | null {
  if (typeof input.payload !== "object" || input.payload === null || !("text" in input.payload)) {
    return null;
  }

  const text = (input.payload as { text?: unknown }).text;
  return typeof text === "string" ? text : null;
}

function prefersVisualUpload(input: CapabilityActionInput): boolean {
  if (typeof input.payload !== "object" || input.payload === null) {
    return false;
  }

  const payload = input.payload as {
    preferredFileType?: unknown;
    acceptedFileTypes?: unknown;
  };

  if (payload.preferredFileType === "image" || payload.preferredFileType === "video" || payload.preferredFileType === "avatar") {
    return true;
  }

  if (Array.isArray(payload.acceptedFileTypes)) {
    return payload.acceptedFileTypes.some((item) => item === "image" || item === "video" || item === "avatar");
  }

  return false;
}

export function createWechatCapabilityAdapter(runtime?: WechatCapabilityRuntime): CapabilityAdapter {
  const host = resolveWechatRuntime<WechatCapabilityRuntime>(runtime);

  return {
    status(capability) {
      switch (capability) {
        case "clipboard":
          return ok(Boolean(host.setClipboardData));
        case "device":
          return ok(Boolean(host.getSystemInfo));
        case "location":
          return ok(Boolean(host.getLocation));
        case "share":
          return ok(Boolean(host.showShareMenu));
        case "payment":
          return ok(Boolean(host.requestPayment));
        case "upload":
          return ok(Boolean(host.chooseMedia || host.chooseMessageFile));
        default:
          return ok(false);
      }
    },

    execute<TResult = unknown>(input: CapabilityActionInput): Promise<import("@minix/core").Result<CapabilityActionResult<TResult>>> {
      switch (input.capability) {
        case "clipboard": {
          const text = requirePayloadText(input);
          if (text === null) {
            return Promise.resolve(
              fail(createError("INVALID_ARGUMENT", "clipboard.writeText requires a text payload", { recoverable: true })),
            );
          }

          if (!host.setClipboardData) {
            return Promise.resolve(
              fail(createError("CAPABILITY_UNAVAILABLE", "clipboard capability is unavailable", { recoverable: true })),
            );
          }

          return new Promise((resolve) => {
            host.setClipboardData?.({
              data: text,
              success() {
                resolve(ok({
                  capability: input.capability,
                  action: input.action,
                } as CapabilityActionResult<TResult>));
              },
              fail(error) {
                resolve(fail(createError("CAPABILITY_UNAVAILABLE", "wechat clipboard write failed", {
                  cause: error,
                  recoverable: true,
                })));
              },
            });
          });
        }

        case "device":
          if (!host.getSystemInfo) {
            return Promise.resolve(
              fail(createError("CAPABILITY_UNAVAILABLE", "device capability is unavailable", { recoverable: true })),
            );
          }

          return new Promise((resolve) => {
            host.getSystemInfo?.({
              success(result) {
                resolve(ok({
                  capability: input.capability,
                  action: input.action,
                  value: result as TResult,
                }));
              },
              fail(error) {
                resolve(fail(createError("CAPABILITY_UNAVAILABLE", "wechat getSystemInfo failed", {
                  cause: error,
                  recoverable: true,
                })));
              },
            });
          });

        case "share":
          if (!host.showShareMenu) {
            return Promise.resolve(
              fail(createError("CAPABILITY_UNAVAILABLE", "share capability is unavailable", { recoverable: true })),
            );
          }

          return new Promise((resolve) => {
            const payload = typeof input.payload === "object" && input.payload !== null ? (input.payload as TResult) : undefined;
            host.showShareMenu?.({
              success() {
                resolve(ok({
                  capability: input.capability,
                  action: input.action,
                  ...(payload ? { value: payload } : {}),
                  detail: "share dispatch reserved through wechat capability adapter",
                } as CapabilityActionResult<TResult>));
              },
              fail(error) {
                resolve(fail(createError("CAPABILITY_UNAVAILABLE", "wechat share menu failed", {
                  cause: error,
                  recoverable: true,
                })));
              },
            });
          });

        case "payment":
          if (!host.requestPayment) {
            return Promise.resolve(
              fail(createError("CAPABILITY_UNAVAILABLE", "payment capability is unavailable", { recoverable: true })),
            );
          }

          return new Promise((resolve) => {
            const payload = typeof input.payload === "object" && input.payload !== null ? (input.payload as Record<string, unknown>) : {};
            host.requestPayment?.({
              ...payload,
              success(result) {
                resolve(ok({
                  capability: input.capability,
                  action: input.action,
                  ...(result ? { value: result as TResult } : {}),
                  detail: "wechat payment execution dispatched with gateway client parameters",
                }));
              },
              fail(error) {
                resolve(fail(createError("CAPABILITY_UNAVAILABLE", "wechat payment execution failed", {
                  cause: error,
                  recoverable: true,
                })));
              },
            });
          });

        case "upload": {
          const payload = typeof input.payload === "object" && input.payload !== null ? (input.payload as Record<string, unknown>) : {};
          const useMediaPicker = prefersVisualUpload(input);
          if (useMediaPicker) {
            if (!host.chooseMedia) {
              return Promise.resolve(
                fail(createError("CAPABILITY_UNAVAILABLE", "upload capability is unavailable", { recoverable: true })),
              );
            }

            return new Promise((resolve) => {
              host.chooseMedia?.({
                count: typeof payload.maxSelectCount === "number" ? payload.maxSelectCount : 1,
                mediaType: ["image", "video"],
                success(result) {
                  resolve(ok({
                    capability: input.capability,
                    action: input.action,
                    value: result as TResult,
                    detail: "upload reservation selected through wechat chooseMedia",
                  }));
                },
                fail(error) {
                  resolve(fail(createError("CAPABILITY_UNAVAILABLE", "wechat media selection failed", {
                    cause: error,
                    recoverable: true,
                  })));
                },
              });
            });
          }

          if (!host.chooseMessageFile) {
            return Promise.resolve(
              fail(createError("CAPABILITY_UNAVAILABLE", "upload capability is unavailable", { recoverable: true })),
            );
          }

          return new Promise((resolve) => {
            host.chooseMessageFile?.({
              count: typeof payload.maxSelectCount === "number" ? payload.maxSelectCount : 1,
              type: "file",
              success(result) {
                resolve(ok({
                  capability: input.capability,
                  action: input.action,
                  value: result as TResult,
                  detail: "upload reservation selected through wechat chooseMessageFile",
                }));
              },
              fail(error) {
                resolve(fail(createError("CAPABILITY_UNAVAILABLE", "wechat file selection failed", {
                  cause: error,
                  recoverable: true,
                })));
              },
            });
          });
        }

        default:
          return Promise.resolve(
            fail(createError("PLATFORM_UNSUPPORTED", `wechat capability "${input.capability}" is not implemented`, {
              recoverable: false,
            })),
          );
      }
    },
  };
}
