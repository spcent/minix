import type { PurchaseMembershipRequest, ReadingProgress } from "@minix/contracts";

import { createDefaultUserState } from "./data";
import type { UserState } from "./types";

interface PersistedUserState {
  membershipPlanId?: PurchaseMembershipRequest["planId"];
  bookshelfNovelIds: string[];
  progressByNovelId: Record<string, ReadingProgress>;
}

export function serializeUserState(userState: UserState): string {
  const persisted: PersistedUserState = {
    ...(userState.membershipPlanId ? { membershipPlanId: userState.membershipPlanId } : {}),
    bookshelfNovelIds: Array.from(userState.bookshelfNovelIds),
    progressByNovelId: userState.progressByNovelId,
  };

  return JSON.stringify(persisted);
}

export function deserializeUserState(serialized: string | null | undefined): UserState {
  if (!serialized) {
    return createDefaultUserState();
  }

  const parsed = JSON.parse(serialized) as Partial<PersistedUserState>;
  return {
    ...(parsed.membershipPlanId ? { membershipPlanId: parsed.membershipPlanId } : {}),
    bookshelfNovelIds: new Set(parsed.bookshelfNovelIds ?? []),
    progressByNovelId: parsed.progressByNovelId ?? {},
  };
}
