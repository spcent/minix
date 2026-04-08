import type { CapabilityActionInput, CapabilityActionResult } from "@minix/contracts";
import { createError, fail, ok, type CapabilityAdapter } from "@minix/core";

interface H5Clipboard {
  writeText?: (text: string) => Promise<void>;
}

interface H5NavigatorLike {
  clipboard?: H5Clipboard;
  geolocation?: unknown;
  language?: string;
  platform?: string;
  share?: (data: Record<string, unknown>) => Promise<void>;
  userAgent?: string;
}

interface H5PaymentRuntime {
  startPayment?: (payload: Record<string, unknown>) => Promise<Record<string, unknown> | void>;
}

export interface H5CapabilityAdapterOptions {
  navigator?: H5NavigatorLike;
  payment?: H5PaymentRuntime;
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
  const payment = options.payment;

  return {
    status(capability) {
      switch (capability) {
        case "clipboard":
          return ok(Boolean(navigator?.clipboard?.writeText));
        case "device":
          return ok(Boolean(navigator));
        case "location":
          return ok(Boolean(navigator?.geolocation));
        case "share":
          return ok(Boolean(navigator?.share));
        case "payment":
          return ok(Boolean(payment?.startPayment));
        default:
          return ok(false);
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
            if (!navigator?.share) {
              return fail(createError("CAPABILITY_UNAVAILABLE", "share capability is unavailable", { recoverable: true }));
            }

            await navigator.share(typeof input.payload === "object" && input.payload !== null ? input.payload as Record<string, unknown> : {});
            return ok({
              capability: input.capability,
              action: input.action,
            } as CapabilityActionResult<TResult>);
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
              detail: "payment execution reserved through h5 capability adapter",
            });
          } catch (error) {
            return fail(createError("CAPABILITY_UNAVAILABLE", "h5 payment execution failed", {
              cause: error,
              recoverable: true,
            }));
          }

        default:
          return fail(createError("PLATFORM_UNSUPPORTED", `h5 capability "${input.capability}" is not implemented`, {
            recoverable: false,
          }));
      }
    },
  };
}
