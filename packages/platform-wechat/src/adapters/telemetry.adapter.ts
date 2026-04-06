import type { TelemetryErrorEvent, TelemetryEvent, TelemetrySpan } from "@minix/contracts";
import { ok, type TelemetryAdapter } from "@minix/core";

import { resolveWechatRuntime } from "../runtime";

interface WechatTelemetryRuntime {
  reportAnalytics?: (name: string, data: Record<string, string>) => void;
}

export interface WechatTelemetryLogger {
  debug?: (...args: unknown[]) => void;
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}

function toAnalyticsPayload(attributes: TelemetryEvent["attributes"]): Record<string, string> {
  if (!attributes) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(attributes)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  );
}

export function createWechatTelemetryAdapter(
  runtime?: WechatTelemetryRuntime,
  logger: WechatTelemetryLogger = console,
): TelemetryAdapter {
  const host = resolveWechatRuntime<WechatTelemetryRuntime>(runtime);

  return {
    async event(event: TelemetryEvent) {
      if (host.reportAnalytics) {
        host.reportAnalytics(event.name, toAnalyticsPayload(event.attributes));
      } else {
        logger.info?.("[minix:wechat:event]", event);
      }

      return ok(undefined);
    },

    async error(event: TelemetryErrorEvent) {
      logger.error?.("[minix:wechat:error]", event);
      return ok(undefined);
    },

    async span(span: TelemetrySpan) {
      logger.debug?.("[minix:wechat:span]", span);
      return ok(undefined);
    },
  };
}
