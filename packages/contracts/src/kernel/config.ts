import type { CapabilityKind } from "./capability";

export type ConfigPrimitive = string | number | boolean | null;

export type ConfigValue =
  | ConfigPrimitive
  | ConfigValue[]
  | {
      [key: string]: ConfigValue;
    };

export interface FeatureConfig {
  [key: string]: ConfigValue;
}

export interface FeatureConfigMap {
  [featureKey: string]: FeatureConfig;
}

export interface AppConfigShape {
  profile?: string;
  entries?: FeatureConfigMap;
  integrationEntries?: Record<string, FeatureConfig>;
  capabilityEntries?: Partial<Record<CapabilityKind, FeatureConfig>>;
}
