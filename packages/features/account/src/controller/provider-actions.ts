import type {
  AccountProviderRevokeRequest,
  AccountUnbindRequest,
} from "@minix/contracts";

import type { AccountState } from "../model";

type ProviderActionKind = "unlink" | "revoke";

export function resolveProviderActionBlockedMessage(
  state: AccountState,
  input: AccountUnbindRequest | AccountProviderRevokeRequest,
  kind: ProviderActionKind,
): string | undefined {
  const providerIdentity = state.accountSummary?.providerIdentities?.find(
    (item) => item.provider === input.provider && item.providerUserId === input.providerUserId,
  );
  const action = providerIdentity?.actions.find((item) => item.kind === kind);
  if (!action || action.available) {
    return undefined;
  }

  return action.blockedReason ?? `${providerIdentity?.providerLabel ?? "Provider"} cannot be ${kind === "unlink" ? "unlinked" : "revoked"} right now.`;
}
