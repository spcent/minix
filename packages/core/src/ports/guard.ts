import type { GuardDecision, GuardPolicy } from "@minix/contracts";

import type { Result } from "../error/index";
import type { AppContext } from "../types/index";

export interface GuardAdapter {
  evaluate(policy: GuardPolicy, context: AppContext): Promise<Result<GuardDecision>>;
}
