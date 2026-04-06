import type { TelemetryErrorEvent, TelemetryEvent, TelemetrySpan } from "@minix/contracts";

import type { Result } from "../error/index";

export interface TelemetryAdapter {
  event(event: TelemetryEvent): Promise<Result<void>>;
  error(event: TelemetryErrorEvent): Promise<Result<void>>;
  span(span: TelemetrySpan): Promise<Result<void>>;
}
