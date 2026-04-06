import type { TelemetryErrorEvent, TelemetryEvent, TelemetrySpan } from "@minix/contracts";
import { ok, type TelemetryAdapter } from "@minix/core";

export interface H5TelemetryLogger {
  debug?: (...args: unknown[]) => void;
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}

export interface H5TelemetryAdapterOptions {
  logger?: H5TelemetryLogger;
}

export function createH5TelemetryAdapter(options: H5TelemetryAdapterOptions = {}): TelemetryAdapter {
  const logger = options.logger ?? console;

  return {
    async event(event: TelemetryEvent) {
      logger.info?.("[minix:h5:event]", event);
      return ok(undefined);
    },

    async error(event: TelemetryErrorEvent) {
      logger.error?.("[minix:h5:error]", event);
      return ok(undefined);
    },

    async span(span: TelemetrySpan) {
      logger.debug?.("[minix:h5:span]", span);
      return ok(undefined);
    },
  };
}
