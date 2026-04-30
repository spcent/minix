import { ok, type Result } from "@minix/core";
import type { AccountOperation } from "@minix/contracts";

export function findAvailableOperation(
  operations: AccountOperation[] | undefined,
  kind: AccountOperation["kind"],
): Result<AccountOperation | undefined> {
  const operation = operations?.find((item) => item.kind === kind);
  if (operation && !operation.available) {
    return {
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: operation.blockedReason ?? `${operation.label} is unavailable.`,
        recoverable: true,
      },
    };
  }

  return ok(operation);
}
