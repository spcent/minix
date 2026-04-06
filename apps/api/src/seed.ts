import type { ApiStore, UserState } from "./types";

export const SAMPLE_API_SEED_USER_ID = "minix-demo-user";

export interface SampleApiSeedSummary {
  contentSource: "code-backed";
  mutableState: "lazy-user-state";
  defaultUserId: string;
}

export function createSampleApiSeedSummary(): SampleApiSeedSummary {
  return {
    contentSource: "code-backed",
    mutableState: "lazy-user-state",
    defaultUserId: SAMPLE_API_SEED_USER_ID,
  };
}

export async function ensureSampleApiUserState(
  store: ApiStore,
  userId = SAMPLE_API_SEED_USER_ID,
): Promise<UserState> {
  return store.getUserState(userId);
}
