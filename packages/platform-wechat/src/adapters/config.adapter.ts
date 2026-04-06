import { ok, type ConfigAdapter, type ConfigValue, type FeatureConfig } from "@minix/core";

export interface WechatConfigAdapterOptions {
  values?: Record<string, ConfigValue>;
  featureConfig?: Record<string, FeatureConfig>;
}

export function createWechatConfigAdapter(options: WechatConfigAdapterOptions = {}): ConfigAdapter {
  const values = options.values ?? {};
  const featureConfig = options.featureConfig ?? {};

  return {
    get<TValue extends ConfigValue = ConfigValue>(key: string) {
      return ok((key in values ? values[key] : null) as TValue | null);
    },

    getFeatureConfig(featureKey) {
      return ok(featureConfig[featureKey] ?? null);
    },
  };
}
