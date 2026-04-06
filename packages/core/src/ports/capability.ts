import type { CapabilityActionInput, CapabilityActionResult, CapabilityKind } from "@minix/contracts";

import type { Result } from "../error/index";

export interface CapabilityAdapter {
  status(capability: CapabilityKind): Result<boolean>;
  execute<TResult = unknown>(input: CapabilityActionInput): Promise<Result<CapabilityActionResult<TResult>>>;
}
