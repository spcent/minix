import type {
  CapabilityActionInput,
  CapabilityActionResult,
  CapabilityKind,
  CapabilityStatus,
} from "@minix/contracts";
import {
  createError,
  fail,
  ok,
  resolveCapabilityPayloadText,
  resolveShareTargetText,
  type CapabilityAdapter,
} from "@minix/core";

import { resolveWechatRuntime } from "../runtime";

interface WechatCapabilityRuntime {
  getLocation?: (options: {
    success?: (result: Record<string, unknown>) => void;
    fail?: (error: unknown) => void;
  }) => void;
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

  function createCapabilityStatus(
    capability: CapabilityKind,
    input: Omit<CapabilityStatus, "capability">,
  ) {
    return ok({
      capability,
      ...input,
    });
  }

  return {
    status(capability) {
      switch (capability) {
        case "clipboard":
          return host.setClipboardData
            ? createCapabilityStatus(capability, {
                available: true,
                mode: "native",
                detail: "WeChat clipboard API is available.",
              })
            : createCapabilityStatus(capability, {
                available: false,
                mode: "unavailable",
                detail: "WeChat clipboard API is unavailable.",
                reason: "clipboard-api-missing",
              });
        case "device":
          return host.getSystemInfo
            ? createCapabilityStatus(capability, {
                available: true,
                mode: "native",
                detail: "WeChat device info API is available.",
              })
            : createCapabilityStatus(capability, {
                available: false,
                mode: "unavailable",
                detail: "WeChat device info API is unavailable.",
                reason: "device-api-missing",
              });
        case "location":
          return host.getLocation
            ? createCapabilityStatus(capability, {
                available: true,
                mode: "native",
                detail: "WeChat location API is available.",
              })
            : createCapabilityStatus(capability, {
                available: false,
                mode: "unavailable",
                detail: "WeChat location API is unavailable.",
                reason: "location-api-missing",
              });
        case "share":
          return host.showShareMenu
            ? createCapabilityStatus(capability, {
                available: true,
                mode: "native",
                detail: "WeChat share menu is available.",
              })
            : host.setClipboardData
              ? createCapabilityStatus(capability, {
                  available: true,
                  mode: "degraded",
                  detail: "WeChat share menu is unavailable. Falling back to clipboard copy.",
                  reason: "clipboard-fallback",
                  fallbackActionLabel: "Copy share link",
                })
              : createCapabilityStatus(capability, {
                  available: false,
                  mode: "unavailable",
                  detail: "No share menu or clipboard fallback is available.",
                  reason: "share-api-missing",
                });
        case "payment":
          return host.requestPayment
            ? createCapabilityStatus(capability, {
                available: true,
                mode: "native",
                detail: "WeChat payment API is available.",
              })
            : createCapabilityStatus(capability, {
                available: false,
                mode: "unavailable",
                detail: "WeChat payment API is unavailable.",
                reason: "payment-api-missing",
              });
        case "upload":
          return host.chooseMedia || host.chooseMessageFile
            ? createCapabilityStatus(capability, {
                available: true,
                mode: "native",
                detail: "WeChat media or file picker is available.",
              })
            : createCapabilityStatus(capability, {
                available: false,
                mode: "unavailable",
                detail: "No WeChat picker API is available.",
                reason: "upload-picker-missing",
              });
        default:
          return createCapabilityStatus(capability, {
            available: false,
            mode: "unavailable",
            detail: `wechat capability "${capability}" is not implemented`,
            reason: "unsupported-capability",
          });
      }
    },

    execute<TResult = unknown>(input: CapabilityActionInput): Promise<import("@minix/core").Result<CapabilityActionResult<TResult>>> {
      switch (input.capability) {
        case "clipboard": {
          const text = resolveCapabilityPayloadText(input);
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
          if (host.showShareMenu) {
            return new Promise((resolve) => {
              const payload = typeof input.payload === "object" && input.payload !== null ? (input.payload as TResult) : undefined;
              host.showShareMenu?.({
                success() {
                  resolve(ok({
                    capability: input.capability,
                    action: input.action,
                    ...(payload ? { value: payload } : {}),
                    detail: "WeChat share menu dispatched successfully.",
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
          }

          if (!host.setClipboardData) {
            return Promise.resolve(
              fail(createError("CAPABILITY_UNAVAILABLE", "share capability is unavailable", { recoverable: true })),
            );
          }

          return new Promise((resolve) => {
            const payload = typeof input.payload === "object" && input.payload !== null ? (input.payload as Record<string, unknown>) : {};
            host.setClipboardData?.({
              data: resolveShareTargetText(payload),
              success() {
                resolve(ok({
                  capability: input.capability,
                  action: input.action,
                  value: payload as TResult,
                  detail: "WeChat share menu was unavailable. Copied the share target to clipboard instead.",
                  degraded: true,
                  fallbackActionLabel: "Copy share link",
                } as CapabilityActionResult<TResult>));
              },
              fail(error) {
                resolve(fail(createError("CAPABILITY_UNAVAILABLE", "wechat share clipboard fallback failed", {
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
                  detail: "WeChat payment executed with gateway client parameters.",
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

        case "location":
          if (!host.getLocation) {
            return Promise.resolve(
              fail(createError("CAPABILITY_UNAVAILABLE", "location capability is unavailable", { recoverable: true })),
            );
          }

          return new Promise((resolve) => {
            host.getLocation?.({
              success(result) {
                resolve(ok({
                  capability: input.capability,
                  action: input.action,
                  value: result as TResult,
                  detail: "WeChat location resolved successfully.",
                }));
              },
              fail(error) {
                resolve(fail(createError("CAPABILITY_UNAVAILABLE", "wechat location failed", {
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
                    detail: "WeChat chooseMedia selected upload input.",
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
                  detail: "WeChat chooseMessageFile selected upload input.",
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
