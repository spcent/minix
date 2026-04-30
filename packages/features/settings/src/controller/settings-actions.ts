import type { UpdateSettingsRequest } from "@minix/contracts";

type DevicePreferenceUpdate = NonNullable<NonNullable<UpdateSettingsRequest["preferences"]>["device"]>;
type DeveloperPreferenceUpdate = NonNullable<
  NonNullable<UpdateSettingsRequest["preferences"]>["developerOptions"]
>;
type PrivacyPreferenceUpdate = NonNullable<UpdateSettingsRequest["privacyOptions"]>;

export function createNotificationsEnabledUpdate(nextValue: boolean): UpdateSettingsRequest {
  return {
    preferences: {
      notificationsEnabled: nextValue,
    },
  };
}

export function createDevicePreferenceUpdate<T extends keyof DevicePreferenceUpdate>(
  key: T,
  value: DevicePreferenceUpdate[T],
): UpdateSettingsRequest {
  return {
    preferences: {
      device: {
        [key]: value,
      },
    },
  };
}

export function createPrivacyPreferenceUpdate<T extends keyof PrivacyPreferenceUpdate>(
  key: T,
  value: PrivacyPreferenceUpdate[T],
): UpdateSettingsRequest {
  return {
    privacyOptions: {
      [key]: value,
    },
  };
}

export function createDeveloperPreferenceUpdate<T extends keyof DeveloperPreferenceUpdate>(
  key: T,
  value: DeveloperPreferenceUpdate[T],
): UpdateSettingsRequest {
  return {
    preferences: {
      developerOptions: {
        [key]: value,
      },
    },
  };
}
