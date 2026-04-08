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
            host.showShareMenu?.({
              success() {
                resolve(ok({
                  capability: input.capability,
                  action: input.action,
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
                  detail: "payment execution reserved through wechat capability adapter",
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
