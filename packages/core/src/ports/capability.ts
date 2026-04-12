import type { CapabilityActionInput, CapabilityActionResult, CapabilityKind, CapabilityStatus } from "@minix/contracts";

import type { Result } from "../error/index";

export interface CapabilityAdapter {
  status(capability: CapabilityKind): Result<CapabilityStatus>;
  execute<TResult = unknown>(input: CapabilityActionInput): Promise<Result<CapabilityActionResult<TResult>>>;
}
