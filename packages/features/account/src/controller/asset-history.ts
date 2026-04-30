import type {
  ListUserAssetHistoryRequest,
  UserAssetHistoryResponse,
  UserAssetLedgerEntry,
} from "@minix/contracts";

import type { AccountSection, AccountState } from "../model";
import { upsertSection } from "./section-utils";

export function createAssetLedgerSection(entries: UserAssetLedgerEntry[]): AccountSection | undefined {
  if (entries.length === 0) {
    return undefined;
  }

  return {
    key: "asset-ledger",
    title: "Asset history",
    items: entries.map((entry) => ({
      key: entry.ledgerId,
      label: entry.title,
      value: entry.message,
      hint: [
        entry.subject,
        entry.kind,
        entry.entitlement?.label,
        entry.membershipPlanId,
        entry.pointsDelta !== undefined ? `points ${entry.pointsDelta >= 0 ? "+" : ""}${entry.pointsDelta}` : undefined,
        entry.balanceDeltaCents !== undefined
          ? `balance ${(entry.balanceDeltaCents / 100).toFixed(2)} CNY`
          : undefined,
        entry.createdAt,
      ]
        .filter(Boolean)
        .join(" · "),
    })),
  };
}

export function createAssetHistoryRequestPath(input: ListUserAssetHistoryRequest): string {
  const params = new URLSearchParams({
    ...(input.page ? { page: String(input.page) } : {}),
    ...(input.pageSize ? { pageSize: String(input.pageSize) } : {}),
    ...(input.subject ? { subject: input.subject } : {}),
  });

  return params.size > 0 ? `/account/assets/history?${params.toString()}` : "/account/assets/history";
}

export function createAssetHistoryStatePatch(
  state: AccountState,
  response: UserAssetHistoryResponse,
): Pick<AccountState, "accountSummary" | "assetLedgerEntries" | "sections"> & Partial<Pick<AccountState, "accountWorkspaceSummary">> {
  const assetLedgerSection = createAssetLedgerSection(response.ledgerEntries);
  return {
    accountSummary: response.accountSummary,
    ...(response.accountWorkspaceSummary
      ? { accountWorkspaceSummary: response.accountWorkspaceSummary }
      : {}),
    assetLedgerEntries: response.ledgerEntries,
    sections: assetLedgerSection ? upsertSection(state.sections, assetLedgerSection) : state.sections,
  };
}
