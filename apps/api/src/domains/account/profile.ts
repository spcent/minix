import type { UserState } from "../../types";

export function applyAccountProfileUpdate(
  userState: UserState,
  payload: {
    nickname?: string | undefined;
    region?: string | undefined;
    bio?: string | undefined;
    avatarAssetId?: string | undefined;
  },
): void {
  userState.profileOverrides = {
    ...(userState.profileOverrides ?? {}),
    ...(payload.nickname ? { nickname: payload.nickname } : {}),
    ...(payload.region ? { region: payload.region } : {}),
    ...(payload.bio ? { bio: payload.bio } : {}),
    ...(payload.avatarAssetId ? { avatarAssetId: payload.avatarAssetId } : {}),
  };
}
