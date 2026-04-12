import type {
  PurchaseMembershipRequest,
  UserAssetLedgerEntry,
  UserAssetSummary,
  UserEntitlement,
} from "@minix/contracts";

import { createMembershipOverview } from "../payment/catalog";
import type { UserState } from "../../types";

export function createAssetLedgerEntry(
  input: Omit<UserAssetLedgerEntry, "ledgerId"> & { ledgerId?: string },
): UserAssetLedgerEntry {
  return {
    ledgerId: input.ledgerId ?? `asset_ledger_${crypto.randomUUID()}`,
    subject: input.subject,
    kind: input.kind,
    title: input.title,
    message: input.message,
    createdAt: input.createdAt,
    sourceType: input.sourceType,
    ...(input.sourceId ? { sourceId: input.sourceId } : {}),
    ...(input.pointsDelta !== undefined ? { pointsDelta: input.pointsDelta } : {}),
    ...(input.levelDelta !== undefined ? { levelDelta: input.levelDelta } : {}),
    ...(input.balanceDeltaCents !== undefined ? { balanceDeltaCents: input.balanceDeltaCents } : {}),
    ...(input.frozenBalanceDeltaCents !== undefined ? { frozenBalanceDeltaCents: input.frozenBalanceDeltaCents } : {}),
    ...(input.membershipPlanId ? { membershipPlanId: input.membershipPlanId } : {}),
    ...(input.entitlement ? { entitlement: input.entitlement } : {}),
  };
}

export function appendUserAssetLedgerEntry(
  userState: UserState,
  entry: UserAssetLedgerEntry,
): UserAssetLedgerEntry {
  userState.assetLedgerEntries = [...(userState.assetLedgerEntries ?? []), entry];
  return entry;
}

function deriveUserEntitlements(entries: UserAssetLedgerEntry[]): UserEntitlement[] {
  const entitlementsById = new Map<string, UserEntitlement>();

  for (const entry of entries) {
    if (!entry.entitlement) {
      continue;
    }

    const existing = entitlementsById.get(entry.entitlement.entitlementId);
    entitlementsById.set(entry.entitlement.entitlementId, {
      ...(existing ?? entry.entitlement),
      ...entry.entitlement,
    });
  }

  return Array.from(entitlementsById.values()).sort((left, right) =>
    right.entitlementId.localeCompare(left.entitlementId),
  );
}

function deriveMembershipPlanFromLedger(
  entries: UserAssetLedgerEntry[],
): PurchaseMembershipRequest["planId"] | undefined {
  const activeMembership = entries
    .filter((entry) => entry.subject === "membership" && entry.membershipPlanId)
    .at(-1);

  return activeMembership?.membershipPlanId;
}

export function deriveUserAssetSummary(userState: UserState): {
  summary: UserAssetSummary;
  membershipPlanId?: PurchaseMembershipRequest["planId"];
  activeEntitlements: UserEntitlement[];
} {
  const assetLedgerEntries = userState.assetLedgerEntries ?? [];
  let points = 0;
  let level = 1;
  let balanceCents = 0;
  let frozenBalanceCents = 0;

  for (const entry of assetLedgerEntries) {
    points += entry.pointsDelta ?? 0;
    level += entry.levelDelta ?? 0;
    balanceCents += entry.balanceDeltaCents ?? 0;
    frozenBalanceCents += entry.frozenBalanceDeltaCents ?? 0;
  }

  const activeEntitlements = deriveUserEntitlements(assetLedgerEntries).filter(
    (entitlement) => entitlement.active,
  );
  const membershipPlanId =
    userState.membershipPlanId ?? deriveMembershipPlanFromLedger(assetLedgerEntries);
  const membership = createMembershipOverview(membershipPlanId);
  const summary: UserAssetSummary = {
    points: Math.max(0, points),
    level: Math.max(1, level),
    membership,
    entitlementLabels:
      activeEntitlements.length > 0
        ? activeEntitlements.map((entitlement) => entitlement.label)
        : ["basic-access"],
    balanceCents,
    availableBalanceCents: balanceCents - frozenBalanceCents,
    frozenBalanceCents,
    activeEntitlements,
  };

  return {
    summary,
    ...(membershipPlanId ? { membershipPlanId } : {}),
    activeEntitlements,
  };
}

export function listUserAssetLedgerEntries(
  userState: UserState,
  request: {
    page?: number;
    pageSize?: number;
    subject?: "all" | UserAssetLedgerEntry["subject"];
  },
): {
  ledgerEntries: UserAssetLedgerEntry[];
  pagination: {
    page: number;
    pageSize: number;
    hasMore: boolean;
    total: number;
  };
} {
  const page = request.page ?? 1;
  const pageSize = request.pageSize ?? 20;
  const filteredEntries = (userState.assetLedgerEntries ?? [])
    .filter((entry) =>
      request.subject && request.subject !== "all" ? entry.subject === request.subject : true,
    )
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const startIndex = (page - 1) * pageSize;

  return {
    ledgerEntries: filteredEntries.slice(startIndex, startIndex + pageSize),
    pagination: {
      page,
      pageSize,
      hasMore: startIndex + pageSize < filteredEntries.length,
      total: filteredEntries.length,
    },
  };
}
